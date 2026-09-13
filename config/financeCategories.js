export const DEFAULT_FINANCE_CATEGORIES = {
  expense: [
    {
      name: 'Food & Dining',
      subCategories: ['Breakfast', 'Lunch', 'Dinner', 'Sahri', 'Iftar', 'Groceries', 'Restaurants', 'Coffee & Snacks', 'Delivery'],
    },
    {
      name: 'Religion & Deen',
      subCategories: ['Umrah & Hajj', 'Fitra', 'Zakat', 'Sadaqah', 'Islamic Books', 'Donations'],
    },
    {
      name: 'Technology & Cloud',
      subCategories: ['Cloud & Hosting', 'AI Tools', 'Software Subscriptions', 'Hardware & Gadgets', 'Domains'],
    },
    {
      name: 'Housing & Rent',
      subCategories: ['Rent', 'Maintenance', 'Furniture', 'Home Improvement'],
    },
    {
      name: 'Bills & Utilities',
      subCategories: ['Electricity', 'Water', 'Internet', 'Mobile Recharge', 'Gas'],
    },
    {
      name: 'Transportation',
      subCategories: ['Fuel', 'Public Transit', 'Taxi/Rideshare (Uber)', 'Vehicle Maintenance'],
    },
    {
      name: 'Shopping & Apparel',
      subCategories: ['Clothing', 'Electronics', 'Personal Care', 'Accessories'],
    },
    {
      name: 'Health & Fitness',
      subCategories: ['Gym & Training', 'Medical', 'Pharmacy', 'Supplements'],
    },
    {
      name: 'Education & Courses',
      subCategories: ['Books', 'Courses & Certifications', 'Tuition', 'Software Tools'],
    },
    {
      name: 'Gifts & Family',
      subCategories: ['Family Support', 'Gifts', 'Celebrations'],
    },
    {
      name: 'Other Expense',
      subCategories: ['Miscellaneous', 'Uncategorized'],
    },
  ],
  income: [
    {
      name: 'Salary',
      subCategories: ['Full-time', 'Part-time', 'Bonus'],
    },
    {
      name: 'Freelance & Business',
      subCategories: ['Client Projects', 'Sales', 'Consulting'],
    },
    {
      name: 'Investment',
      subCategories: ['Dividends', 'Crypto', 'Stocks', 'Real Estate'],
    },
    {
      name: 'Gift & Support',
      subCategories: ['Family Gift', 'Refund', 'Allowance'],
    },
    {
      name: 'Other Income',
      subCategories: ['Miscellaneous'],
    },
  ],
  transfer: [
    {
      name: 'Account Transfer',
      subCategories: ['Savings', 'Investment Account', 'Cash Withdrawal'],
    },
  ],
};

export const DEFAULT_PAYMENT_METHODS = [
  'Cash',
  'Credit Card',
  'Debit Card',
  'Mobile Banking (bKash/Nagad)',
  'Bank Transfer',
  'Other',
];

export const SUPPORTED_CURRENCIES = ['USD', 'BDT', 'SAR', 'EUR', 'GBP'];
