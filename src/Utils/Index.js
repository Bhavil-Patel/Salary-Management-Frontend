export const formatMoney = (value, currency = 'INR') => {
  const code = currency || 'INR';
  const locale = code === 'INR' ? 'en-IN' : 'en-US';
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: code,
    maximumFractionDigits: 0,
  }).format(Number(value) || 0);
};
