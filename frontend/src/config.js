export const API_URL = import.meta.env.PROD 
  ? 'http://goldenhour.assetiq.dpdns.org:12000'
  : `http://${window.location.hostname}:12000`;
