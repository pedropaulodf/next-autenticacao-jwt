export function checkIsBrowser(){
  return typeof window !== "undefined" ? true : false;
}