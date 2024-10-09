const express = require('express');
const {
  initializeData,
  getTransactions,
  getStatistics,
  getBarChartData,
  getPieChartData,
  getCombinedData
} = require('../controllers/transactionController');

const router = express.Router();

router.get('/initialize', initializeData);
router.get('/transactions', getTransactions);
router.get('/statistics', getStatistics);
router.get('/barchart', getBarChartData);
router.get('/piechart', getPieChartData);
router.get('/combined', getCombinedData);

module.exports = router;
