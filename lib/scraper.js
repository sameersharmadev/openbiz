import puppeteer from "puppeteer";
import * as cheerio from "cheerio";
import fs from "fs";
import axios from "axios";

class UdyamScraper {
  constructor() {
    this.baseUrl = "https://udyamregistration.gov.in/UdyamRegistration.aspx";
    this.scrapedData = {
      formSteps: [],
      validationRules: {},
      uiComponents: {},
      formFields: {},
      errorMessages: {},
      jsValidations: [],
      cssClasses: [],
      apiEndpoints: []
    };
  }

  async scrapeWithPuppeteer() {
    const browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--disable-gpu'
      ]
    });

    try {
      const page = await browser.newPage();

      await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');

      await page.goto(this.baseUrl, {
        waitUntil: 'networkidle2',
        timeout: 30000
      });

      await page.waitForSelector('input[type="text"], input[type="submit"], select', { timeout: 10000 });

      const dynamicData = await page.evaluate(() => {
        const data = {
          formFields: {},
          validationRules: {},
          jsValidations: [],
          errorMessages: {},
          dropdownOptions: {},
          eventHandlers: {}
        };

        const inputs = document.querySelectorAll('input, select, textarea');
        inputs.forEach(input => {
          const fieldData = {
            id: input.id || '',
            name: input.name || '',
            type: input.type || input.tagName.toLowerCase(),
            className: input.className || '',
            placeholder: input.placeholder || '',
            maxLength: input.maxLength || null,
            required: input.required || false,
            tabIndex: input.tabIndex || null,
            value: input.value || '',
            autocomplete: input.getAttribute('autocomplete') || '',
            pattern: input.pattern || '',
            min: input.min || '',
            max: input.max || ''
          };

          const label = document.querySelector(`label[for="${input.id}"]`) ||
            input.closest('.form-group')?.querySelector('label') ||
            input.closest('div')?.querySelector('label');

          if (label) {
            fieldData.label = label.textContent.trim();
          }

          if (input.hasAttribute('data-val')) {
            fieldData.validation = {};
            Array.from(input.attributes).forEach(attr => {
              if (attr.name.startsWith('data-val-')) {
                fieldData.validation[attr.name] = attr.value;
              }
            });
          }

          if (input.tagName === 'SELECT') {
            fieldData.options = Array.from(input.options).map(option => ({
              value: option.value,
              text: option.textContent.trim(),
              selected: option.selected
            }));
          }

          data.formFields[input.id || input.name || Math.random().toString(36)] = fieldData;
        });

        const scripts = document.querySelectorAll('script');
        scripts.forEach(script => {
          const content = script.textContent;
          if (content && (content.includes('validation') || content.includes('validate') || content.includes('IsValid'))) {
            const validationMatches = content.match(/function\s+(\w*[Vv]alid\w*)\s*\([^)]*\)/g);
            if (validationMatches) {
              data.jsValidations.push(...validationMatches);
            }

            const panPattern = content.match(/[A-Za-z]{5}[0-9]{4}[A-Za-z]{1}/);
            if (panPattern) {
              data.validationRules.panPattern = panPattern[0];
            }

            const aadhaarPattern = content.match(/\d{12}/);
            if (aadhaarPattern) {
              data.validationRules.aadhaarPattern = aadhaarPattern[0];
            }
          }
        });

        const errorElements = document.querySelectorAll('[style*="color: red"], [style*="color:red"], .error, .validation-error, [id*="error"], [id*="Error"]');
        errorElements.forEach(el => {
          if (el.textContent.trim()) {
            data.errorMessages[el.id || 'generic'] = el.textContent.trim();
          }
        });

        const stepElements = document.querySelectorAll('[class*="step"], [id*="step"], [class*="card-title"]');
        stepElements.forEach((el, index) => {
          if (el.textContent.trim()) {
            data.formSteps = data.formSteps || [];
            data.formSteps.push({
              step: index + 1,
              title: el.textContent.trim(),
              element: el.tagName,
              className: el.className
            });
          }
        });

        return data;
      });

      Object.assign(this.scrapedData, dynamicData);

      await page.screenshot({ path: 'udyam-screenshot.png', fullPage: true });

    } catch (error) {
      throw error;
    } finally {
      await browser.close();
    }
  }

  async scrapeStaticHTML() {
    try {
      const html = fs.readFileSync('raw.html', 'utf-8');
      const $ = cheerio.load(html);

      this.extractFormSteps($);
      this.extractFormFields($);
      this.extractValidationRules($);
      this.extractUIComponents($);
      this.extractJavaScriptValidations($);
      this.extractCSSClasses($);
      this.extractAPIEndpoints($);

    } catch (error) {
      throw error;
    }
  }

  extractFormSteps($) {
    const steps = [];

    const aadhaarCard = $('.card-title:contains("Aadhaar")').closest('.card');
    if (aadhaarCard.length) {
      steps.push({
        step: 1,
        title: "Aadhaar Verification With OTP",
        description: "Aadhaar number validation and OTP generation",
        fields: [
          "txtadharno",
          "txtownername",
          "chkDecarationA",
          "btnValidateAadhaar"
        ],
        validationGroup: "X"
      });
    }

    const panFields = $('input[id*="Pan"], input[name*="Pan"]');
    if (panFields.length) {
      steps.push({
        step: 2,
        title: "PAN Validation",
        description: "PAN number validation for organization",
        fields: ["txtPan", "ddlTypeofOrg"],
        validationGroup: "Y"
      });
    }

    this.scrapedData.formSteps = steps;
  }

  extractFormFields($) {
    const fields = {};

    $('input, select, textarea').each((index, element) => {
      const $el = $(element);
      const fieldData = {
        id: $el.attr('id') || '',
        name: $el.attr('name') || '',
        type: $el.attr('type') || element.tagName.toLowerCase(),
        className: $el.attr('class') || '',
        placeholder: $el.attr('placeholder') || '',
        maxLength: $el.attr('maxlength') || null,
        tabIndex: $el.attr('tabindex') || null,
        required: $el.attr('required') !== undefined,
        autoComplete: $el.attr('autocomplete') || '',
        pattern: $el.attr('pattern') || ''
      };

      const label = $(`label[for="${fieldData.id}"]`).text().trim() ||
        $el.closest('.form-group').find('label').text().trim() ||
        $el.closest('div').find('label').text().trim();

      if (label) {
        fieldData.label = label;
      }

      const validationAttrs = {};
      if (element.attribs) {
        Object.keys(element.attribs).forEach(attrName => {
          if (attrName.startsWith('data-val-')) {
            validationAttrs[attrName] = element.attribs[attrName];
          }
        });
      }

      if (Object.keys(validationAttrs).length > 0) {
        fieldData.validation = validationAttrs;
      }

      if (element.tagName === 'SELECT') {
        fieldData.options = [];
        $el.find('option').each((i, option) => {
          fieldData.options.push({
            value: $(option).attr('value') || '',
            text: $(option).text().trim(),
            selected: $(option).attr('selected') !== undefined
          });
        });
      }

      if (fieldData.id || fieldData.name) {
        fields[fieldData.id || fieldData.name] = fieldData;
      }
    });

    this.scrapedData.formFields = fields;
  }

  extractValidationRules($) {
    const rules = {};

    $('script').each((index, script) => {
      const content = $(script).html();
      if (content) {
        const panMatch = content.match(/[A-Za-z]{5}[0-9]{4}[A-Za-z]{1}/);
        if (panMatch) {
          rules.panPattern = panMatch[0];
          rules.panRegex = '/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/';
          rules.panDescription = "5 letters + 4 digits + 1 letter";
        }

        const aadhaarMatch = content.match(/maxlength="12"/);
        if (aadhaarMatch) {
          rules.aadhaarPattern = "XXXX-XXXX-XXXX";
          rules.aadhaarRegex = '/^[0-9]{12}$/';
          rules.aadhaarDescription = "12 digit number";
        }

        const mobileMatch = content.match(/mobile|Mobile/);
        if (mobileMatch) {
          rules.mobilePattern = "XXXXXXXXXX";
          rules.mobileRegex = '/^[0-9]{10}$/';
          rules.mobileDescription = "10 digit mobile number";
        }

        const emailMatch = content.match(/email|Email/);
        if (emailMatch) {
          rules.emailRegex = '/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/';
          rules.emailDescription = "Valid email format";
        }

        const dateValidations = content.match(/function\s+(calc_date\w+)/g);
        if (dateValidations) {
          rules.dateValidations = dateValidations.map(func => ({
            function: func,
            description: "Date validation function"
          }));
        }
      }
    });

    $('input[pattern], input[required], input[min], input[max]').each((index, element) => {
      const $el = $(element);
      const fieldId = $el.attr('id') || $el.attr('name');

      if (fieldId) {
        rules[fieldId] = {
          required: $el.attr('required') !== undefined,
          pattern: $el.attr('pattern') || '',
          min: $el.attr('min') || '',
          max: $el.attr('max') || '',
          minLength: $el.attr('minlength') || '',
          maxLength: $el.attr('maxlength') || ''
        };
      }
    });

    this.scrapedData.validationRules = rules;
  }

  extractUIComponents($) {
    const components = {
      buttons: [],
      checkboxes: [],
      radioButtons: [],
      dropdowns: [],
      progressIndicators: [],
      modals: [],
      alerts: []
    };

    $('button, input[type="button"], input[type="submit"]').each((index, element) => {
      const $el = $(element);
      components.buttons.push({
        id: $el.attr('id') || '',
        text: $el.val() || $el.text() || '',
        type: $el.attr('type') || 'button',
        className: $el.attr('class') || '',
        onclick: $el.attr('onclick') || ''
      });
    });

    $('input[type="checkbox"]').each((index, element) => {
      const $el = $(element);
      components.checkboxes.push({
        id: $el.attr('id') || '',
        name: $el.attr('name') || '',
        checked: $el.attr('checked') !== undefined,
        label: $(`label[for="${$el.attr('id')}"]`).text().trim()
      });
    });

    $('input[type="radio"]').each((index, element) => {
      const $el = $(element);
      components.radioButtons.push({
        id: $el.attr('id') || '',
        name: $el.attr('name') || '',
        value: $el.attr('value') || '',
        checked: $el.attr('checked') !== undefined,
        label: $(`label[for="${$el.attr('id')}"]`).text().trim()
      });
    });

    $('select').each((index, element) => {
      const $el = $(element);
      const options = [];
      $el.find('option').each((i, option) => {
        options.push({
          value: $(option).attr('value') || '',
          text: $(option).text().trim()
        });
      });

      components.dropdowns.push({
        id: $el.attr('id') || '',
        name: $el.attr('name') || '',
        options: options,
        multiple: $el.attr('multiple') !== undefined
      });
    });

    $('[id*="modal"], [class*="modal"]').each((index, element) => {
      const $el = $(element);
      components.modals.push({
        id: $el.attr('id') || '',
        className: $el.attr('class') || '',
        title: $el.find('.modal-title, .card-title').text().trim()
      });
    });

    this.scrapedData.uiComponents = components;
  }

  extractJavaScriptValidations($) {
    const validations = [];

    $('script').each((index, script) => {
      const content = $(script).html();
      if (content) {
        const functionMatches = content.match(/function\s+(\w*[Vv]alid\w*)\s*\([^)]*\)\s*{[^}]*}/g);
        if (functionMatches) {
          functionMatches.forEach(func => {
            validations.push({
              type: 'validation_function',
              content: func,
              name: func.match(/function\s+(\w+)/)[1]
            });
          });
        }

        const confirmMatches = content.match(/confirm\s*\([^)]+\)/g);
        if (confirmMatches) {
          validations.push({
            type: 'confirmation',
            content: confirmMatches
          });
        }

        const ajaxMatches = content.match(/\$\.ajax\s*\({[^}]*}\)/g);
        if (ajaxMatches) {
          validations.push({
            type: 'ajax_validation',
            content: ajaxMatches
          });
        }
      }
    });

    this.scrapedData.jsValidations = validations;
  }

  extractCSSClasses($) {
    const classes = new Set();

    $('[class]').each((index, element) => {
      const classList = $(element).attr('class').split(/\s+/);
      classList.forEach(cls => {
        if (cls.trim()) {
          classes.add(cls.trim());
        }
      });
    });

    this.scrapedData.cssClasses = Array.from(classes);
  }

  extractAPIEndpoints($) {
    const endpoints = [];

    $('script').each((index, script) => {
      const content = $(script).html();
      if (content) {
        const urlMatches = content.match(/url:\s*["']([^"']+)["']/g);
        if (urlMatches) {
          urlMatches.forEach(match => {
            const url = match.match(/url:\s*["']([^"']+)["']/)[1];
            endpoints.push({
              url: url,
              type: 'ajax'
            });
          });
        }

        const actionMatches = content.match(/action\s*=\s*["']([^"']+)["']/g);
        if (actionMatches) {
          actionMatches.forEach(match => {
            const url = match.match(/action\s*=\s*["']([^"']+)["']/)[1];
            endpoints.push({
              url: url,
              type: 'form_action'
            });
          });
        }
      }
    });

    const formAction = $('form').attr('action');
    if (formAction) {
      endpoints.push({
        url: formAction,
        type: 'main_form'
      });
    }

    this.scrapedData.apiEndpoints = endpoints;
  }

  async saveResults() {
    const dataDir = './data';
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    const schema = {
      metadata: {
        scraped_at: new Date().toISOString(),
        source_url: this.baseUrl,
        scraper_version: "1.0.0"
      },
      ...this.scrapedData
    };

    fs.writeFileSync('./data/form-schema.json', JSON.stringify(schema, null, 2));

    const simplifiedSchema = this.createSimplifiedSchema();
    fs.writeFileSync('./data/form-schema-simple.json', JSON.stringify(simplifiedSchema, null, 2));
  }

  createSimplifiedSchema() {
    return {
      steps: [
        {
          id: "step1",
          title: "Aadhaar Verification",
          description: "Enter Aadhaar number and validate with OTP",
          fields: [
            {
              id: "aadhaarNumber",
              name: "aadhaarNumber",
              type: "text",
              label: "Aadhaar Number / आधार संख्या",
              placeholder: "Your Aadhaar No",
              maxLength: 12,
              required: true,
              pattern: "^[0-9]{12}$",
              validation: {
                required: "Aadhaar number is required",
                pattern: "Please enter a valid 12-digit Aadhaar number",
                minLength: "Aadhaar number must be 12 digits",
                maxLength: "Aadhaar number must be 12 digits"
              }
            },
            {
              id: "entrepreneurName",
              name: "entrepreneurName",
              type: "text",
              label: "Name of Entrepreneur / उद्यमी का नाम",
              placeholder: "Name as per Aadhaar",
              maxLength: 100,
              required: true,
              validation: {
                required: "Entrepreneur name is required",
                maxLength: "Name cannot exceed 100 characters"
              }
            },
            {
              id: "aadhaarConsent",
              name: "aadhaarConsent",
              type: "checkbox",
              label: "I hereby give my consent to Ministry of MSME for using my Aadhaar number",
              required: true,
              checked: true,
              validation: {
                required: "You must consent to proceed"
              }
            }
          ],
          buttons: [
            {
              id: "validateAadhaar",
              type: "submit",
              text: "Validate & Generate OTP",
              className: "btn btn-primary",
              action: "validateAadhaar"
            }
          ]
        },
        {
          id: "step2",
          title: "PAN Validation",
          description: "Enter and validate PAN details",
          fields: [
            {
              id: "panNumber",
              name: "panNumber",
              type: "text",
              label: "PAN Number",
              placeholder: "Enter PAN Number",
              maxLength: 10,
              required: true,
              pattern: "^[A-Z]{5}[0-9]{4}[A-Z]{1}$",
              validation: {
                required: "PAN number is required",
                pattern: "Please enter a valid PAN number (5 letters + 4 digits + 1 letter)"
              }
            },
            {
              id: "organizationType",
              name: "organizationType",
              type: "select",
              label: "Type of Organization",
              required: true,
              options: [
                { value: "1", text: "Proprietorship" },
                { value: "2", text: "Partnership" },
                { value: "3", text: "Hindu Undivided Family" },
                { value: "4", text: "Private Limited Company" },
                { value: "5", text: "Public Limited Company" },
                { value: "6", text: "Limited Liability Partnership" },
                { value: "7", text: "Cooperative Society" },
                { value: "8", text: "Society" },
                { value: "9", text: "Trust" },
                { value: "10", text: "Self Help Group" },
                { value: "11", text: "Others" }
              ],
              validation: {
                required: "Please select organization type"
              }
            }
          ],
          buttons: [
            {
              id: "validatePan",
              type: "submit",
              text: "Validate PAN",
              className: "btn btn-primary",
              action: "validatePan"
            }
          ]
        }
      ],
      validationRules: {
        aadhaar: {
          pattern: "^[0-9]{12}$",
          message: "Please enter a valid 12-digit Aadhaar number"
        },
        pan: {
          pattern: "^[A-Z]{5}[0-9]{4}[A-Z]{1}$",
          message: "Please enter a valid PAN number (Format: ABCDE1234F)"
        },
        mobile: {
          pattern: "^[0-9]{10}$",
          message: "Please enter a valid 10-digit mobile number"
        },
        email: {
          pattern: "^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$",
          message: "Please enter a valid email address"
        }
      },
      uiConfig: {
        theme: "bootstrap",
        responsive: true,
        progressTracker: true,
        autoSave: false,
        realTimeValidation: true
      }
    };
  }

  async run() {
    try {
      if (!fs.existsSync('raw.html')) {
        const response = await axios.get(this.baseUrl);
        fs.writeFileSync('raw.html', response.data, 'utf-8');
      }

      await this.scrapeWithPuppeteer();
      await this.scrapeStaticHTML();
      await this.saveResults();

    } catch (error) {
      console.error('Scraper failed:', error); 
      process.exit(1);
    }
  }
}

// Run the scraper
const scraper = new UdyamScraper();
scraper.run();