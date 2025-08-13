export interface LocationData {
  district: string;
  state: string;
  country: string;
}

export const fetchLocationByPincode = async (pincode: string): Promise<LocationData | null> => {
  try {
    const response = await fetch(`https://api.postalpincode.in/pincode/${pincode}`);
    const data = await response.json();
    
    if (data[0]?.Status === 'Success' && data[0]?.PostOffice?.length > 0) {
      const location = data[0].PostOffice[0];
      return {
        district: location.District,
        state: location.State,
        country: location.Country
      };
    }
  } catch (error) {
    console.error('Pincode lookup failed:', error);
  }
  return null;
};