const axios = require('axios');
const Transaction = require('../models/transactionModel');

// Fetch data and initialize database
exports.initializeData = async (req, res) => {
  try {
    const { data } = await axios.get('https://s3.amazonaws.com/roxiler.com/product_transaction.json');
    await Transaction.deleteMany();  // Clear existing data
    await Transaction.insertMany(data);  // Seed new data
    res.status(200).send('Database initialized successfully');
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch and initialize data' });
  }
};

// Fetch transactions with filters and pagination
exports.getTransactions = async (req, res) => {
  const { month, search = '', page = 1, perPage = 10 } = req.query;
  const regexSearch = new RegExp(search, 'i');
  const itemsPerPage = Number(perPage);

  try {
    const query = {
      dateOfSale: { $regex: `-${month}-`, $options: 'i' },  // Filter by month regardless of the year
      $or: [
        { title: regexSearch },
        { description: regexSearch },
        { price: { $regex: regexSearch } }
      ]
    };

    const totalTransactions = await Transaction.find(query).countDocuments();
    const transactions = await Transaction.find(query)
      .skip((page - 1) * itemsPerPage)
      .limit(itemsPerPage);

    res.json({
      transactions,
      totalPages: Math.ceil(totalTransactions / itemsPerPage),
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching transactions' });
  }
};

// Fetch statistics (total sales, sold items, not sold items)
exports.getStatistics = async (req, res) => {
  try {
    const { month } = req.query;
    const transactions = await Transaction.find({ dateOfSale: { $regex: `-${month}-` } });
    
    const totalSaleAmount = transactions.reduce((sum, item) => (item.sold ? sum + item.price : sum), 0);
    const totalSoldItems = transactions.filter(item => item.sold).length;
    const totalNotSoldItems = transactions.filter(item => !item.sold).length;
    
    res.status(200).json({ totalSaleAmount, totalSoldItems, totalNotSoldItems });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch statistics' });
  }
};

// Fetch bar chart data (price ranges)
exports.getBarChartData = async (req, res) => {
  try {
    const { month } = req.query;
    const priceRanges = {
      "0-100": 0,
      "101-200": 0,
      "201-300": 0,
      "301-400": 0,
      "401-500": 0,
      "501-600": 0,
      "601-700": 0,
      "701-800": 0,
      "801-900": 0,
      "901-above": 0
    };

    const transactions = await Transaction.find({ dateOfSale: { $regex: `-${month}-` } });
    transactions.forEach(transaction => {
      const price = transaction.price;
      if (price <= 100) priceRanges["0-100"]++;
      else if (price <= 200) priceRanges["101-200"]++;
      else if (price <= 300) priceRanges["201-300"]++;
      else if (price <= 400) priceRanges["301-400"]++;
      else if (price <= 500) priceRanges["401-500"]++;
      else if (price <= 600) priceRanges["501-600"]++;
      else if (price <= 700) priceRanges["601-700"]++;
      else if (price <= 800) priceRanges["701-800"]++;
      else if (price <= 900) priceRanges["801-900"]++;
      else priceRanges["901-above"]++;
    });

    res.status(200).json(priceRanges);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch bar chart data' });
  }
};

// Fetch pie chart data (unique categories and count of items in each category)
exports.getPieChartData = async (req, res) => {
  try {
    const { month } = req.query;
    const transactions = await Transaction.find({ dateOfSale: { $regex: `-${month}-` } });

    const categoryCounts = transactions.reduce((acc, transaction) => {
      const category = transaction.category;
      if (!acc[category]) {
        acc[category] = 1;
      } else {
        acc[category]++;
      }
      return acc;
    }, {});

    res.status(200).json(categoryCounts);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch pie chart data' });
  }
};

// Fetch combined data (combines transactions, statistics, bar chart, and pie chart data)
exports.getCombinedData = async (req, res) => {
  try {
    const { month, search = '', page = 1, perPage = 10 } = req.query;

    // Fetch all data in parallel
    const [transactionsResponse, statisticsResponse, barChartResponse, pieChartResponse] = await Promise.all([
      axios.get(`http://localhost:5000/api/transactions`, { params: { month, search, page, perPage } }),
      axios.get(`http://localhost:5000/api/statistics`, { params: { month } }),
      axios.get(`http://localhost:5000/api/barchart`, { params: { month } }),
      axios.get(`http://localhost:5000/api/piechart`, { params: { month } })
    ]);

    res.status(200).json({
      transactions: transactionsResponse.data,
      statistics: statisticsResponse.data,
      barChart: barChartResponse.data,
      pieChart: pieChartResponse.data
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch combined data' });
  }
};
