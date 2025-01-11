export const storeInitialUrlIfNotSet = (url) => {
    const storedUrl = sessionStorage.getItem('initialShareUrl');
    if(!storedUrl){
        sessionStorage.setItem('initialShareUrl', url);
    }
};

export const getAndClearInitialUrl = () => {
  const url = sessionStorage.getItem('initialShareUrl');
  sessionStorage.removeItem('initialShareUrl');
  return url;
}; 