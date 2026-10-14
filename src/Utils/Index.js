export const formatMoney = (value, currency = 'INR') => {
  const code = currency || 'INR';
  const locale = code === 'INR' ? 'en-IN' : 'en-US';
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: code,
    maximumFractionDigits: 0,
  }).format(Number(value) || 0);
};

export const formatMoneyExact = (value, currency = 'INR') => {
  const code = currency || 'INR';
  const locale = code === 'INR' ? 'en-IN' : 'en-US';
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: code,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(value) || 0);
};

export const MONTHS = [
  { value: 1, label: 'January' },
  { value: 2, label: 'February' },
  { value: 3, label: 'March' },
  { value: 4, label: 'April' },
  { value: 5, label: 'May' },
  { value: 6, label: 'June' },
  { value: 7, label: 'July' },
  { value: 8, label: 'August' },
  { value: 9, label: 'September' },
  { value: 10, label: 'October' },
  { value: 11, label: 'November' },
  { value: 12, label: 'December' },
];

export const getMonthName = (monthNum) => {
  const m = Number(monthNum);
  const found = MONTHS.find((item) => item.value === m);
  return found ? found.label : `Month ${monthNum}`;
};

export const numberToWords = (num) => {
  const a = [
    '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten',
    'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen',
  ];
  const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  const n = Math.floor(Math.abs(Number(num) || 0));
  if (n === 0) return 'Zero';

  const inWords = (number) => {
    let str = '';
    if (number > 9999999) {
      str += inWords(Math.floor(number / 10000000)) + ' Crore ';
      number %= 10000000;
    }
    if (number > 99999) {
      str += inWords(Math.floor(number / 100000)) + ' Lakh ';
      number %= 100000;
    }
    if (number > 999) {
      str += inWords(Math.floor(number / 1000)) + ' Thousand ';
      number %= 1000;
    }
    if (number > 99) {
      str += inWords(Math.floor(number / 100)) + ' Hundred ';
      number %= 100;
    }
    if (number > 0) {
      if (number < 20) {
        str += a[number];
      } else {
        str += b[Math.floor(number / 10)];
        if (number % 10 > 0) {
          str += ' ' + a[number % 10];
        }
      }
    }
    return str.trim();
  };

  return inWords(n) + ' Only';
};
