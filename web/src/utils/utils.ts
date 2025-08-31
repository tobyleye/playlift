export const formatNumber = (num: number) => {
  return new Intl.NumberFormat().format(num);
};
