const express = require('express');
const axios = require('axios');
const NodeCache = require('node-cache');

const router = express.Router();

const cache = new NodeCache({ stdTTL: 3600, checkperiod: 120 });

const STOCK_API_BASE_URL = 'http://20.244.56.144/evaluation-service';
const AUTH_API_URL = `${STOCK_API_BASE_URL}/auth`;

let BEARER_TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJNYXBDbGFpbXMiOnsiZXhwIjoxNzQ2ODAxMzk4LCJpYXQiOjE3NDY4MDEwOTgsImlzcyI6IkFmZm9yZG1lZCIsImp0aSI6ImRlMTk4NDYzLWY1MTYtNGI2NC04NTk0LWY0NDNkY2NjNDY3NCIsInN1YiI6Im5pa2hpbC4yMjI2Y3NlYWkxMTAwQGtpZXQuZWR1In0sImVtYWlsIjoibmlraGlsLjIyMjZjc2VhaTExMDBAa2lldC5lZHUiLCJuYW1lIjoibmlraGlsIHJhaWt3YXIiLCJyb2xsTm8iOiIyMjAwMjkxNTIwMTE3IiwiYWNjZXNzQ29kZSI6IlN4VmVqYSIsImNsaWVudElEIjoiZGUxOTg0NjMtZjUxNi00YjY0LTg1OTQtZjQ0M2RjY2M0Njc0IiwiY2xpZW50U2VjcmV0Ijoid0Nja3hBbU5lU3dLdk5RRCJ9.vbR9-yXqJ3ygUkpuwk62AqcpQviSYhmi29Z6yCLn7rA";

const AUTH_BODY = {
    email: "nikhil.2226cseai1100@kiet.edu",
    name: "nikhil raikwar",
    rollNo: "2200291520117",
    accessCode: "SxVeja",
    clientID: "de198463-f516-4b64-8594-f443dccc4674",
    clientSecret: "wCckxAmNeSwKvNQD"
};

const validateQuery = (req, res, next) => {
    const { minutes, aggregation } = req.query;
    const { ticker } = req.params;

    if (!ticker || !/^[A-Z0-9]+$/.test(ticker)) {
        return res.status(400).json({ error: 'Invalid ticker symbol' });
    }

    if (!minutes || isNaN(minutes) || minutes <= 0) {
        return res.status(400).json({ error: 'Invalid minutes parameter' });
    }

    if (aggregation !== 'average') {
        return res.status(400).json({ error: 'Invalid aggregation type' });
    }

    next();
};

const validateCorrelationQuery = (req, res, next) => {
    const { minutes, ticker } = req.query;

    if (!minutes || isNaN(minutes) || minutes <= 0) {
        return res.status(400).json({ error: 'Invalid minutes parameter' });
    }

    if (!ticker || !Array.isArray(ticker) || ticker.length !== 2) {
        return res.status(400).json({ error: 'Exactly two ticker symbols are required' });
    }

    if (ticker.some(t => !/^[A-Z0-9]+$/.test(t))) {
        return res.status(400).json({ error: 'Invalid ticker symbol' });
    }

    next();
};

async function fetchNewBearerToken() {
    try {
        const response = await axios.post(AUTH_API_URL, AUTH_BODY);
        console.log('Auth API Response:', response.data);
        const token = response.data.token || response.data.access_token || response.data.accesstoken;
        if (!token) {
            throw new Error('No token received from auth API');
        }
        return token;
    } catch (error) {
        console.error('Auth API Error:', error.response ? error.response.data : error.message);
        return BEARER_TOKEN;
    }
}

async function fetchStockPriceHistory(ticker, minutes) {
    const cacheKey = `${ticker}:${minutes}`;
    const cachedData = cache.get(cacheKey);

    if (cachedData) {
        return cachedData;
    }

    try {
        BEARER_TOKEN = await fetchNewBearerToken();

        const response = await axios.get(
            `${STOCK_API_BASE_URL}/stocks/${ticker}?minutes=${minutes}`,
            {
                headers: {
                    Authorization: `Bearer ${BEARER_TOKEN}`,
                },
            }
        );
        console.log(`Stock API Response for ${ticker}:`, response.data);

        const priceHistory = Array.isArray(response.data) ? response.data : [response.data.stock];
        
        const averagePrice = priceHistory.reduce((sum, entry) => sum + entry.price, 0) / priceHistory.length;

        const result = {
            averageStockPrice: averagePrice,
            priceHistory: priceHistory.map(entry => ({
                price: entry.price,
                lastUpdatedAt: entry.lastUpdatedAt
            }))
        };

        cache.set(cacheKey, result);
        return result;
    } catch (error) {
        console.error(`Stock API Error for ${ticker}:`, error.response ? error.response.data : error.message);
        throw new Error(`Failed to fetch stock data for ${ticker}: ${error.message}`);
    }
}

function calculateCorrelation(stock1Data, stock2Data) {
    const priceMap1 = new Map(stock1Data.priceHistory.map(entry => [
        new Date(entry.lastUpdatedAt).getTime(),
        entry.price
    ]));
    const priceMap2 = new Map(stock2Data.priceHistory.map(entry => [
        new Date(entry.lastUpdatedAt).getTime(),
        entry.price
    ]));

    const timestamps1 = Array.from(priceMap1.keys());
    const timestamps2 = Array.from(priceMap2.keys());
    const commonTimestamps = timestamps1.filter(ts => timestamps2.includes(ts));

    if (commonTimestamps.length < 2) {
        return 0;
    }

    const alignedPrices1 = commonTimestamps.map(ts => priceMap1.get(ts));
    const alignedPrices2 = commonTimestamps.map(ts => priceMap2.get(ts));

    const n = commonTimestamps.length;

    const mean1 = alignedPrices1.reduce((sum, price) => sum + price, 0) / n;
    const mean2 = alignedPrices2.reduce((sum, price) => sum + price, 0) / n;

    let cov = 0;
    let stdDev1 = 0;
    let stdDev2 = 0;

    for (let i = 0; i < n; i++) {
        const diff1 = alignedPrices1[i] - mean1;
        const diff2 = alignedPrices2[i] - mean2;
        cov += diff1 * diff2;
        stdDev1 += diff1 * diff1;
        stdDev2 += diff2 * diff2;
    }

    cov /= (n - 1);
    stdDev1 = Math.sqrt(stdDev1 / (n - 1));
    stdDev2 = Math.sqrt(stdDev2 / (n - 1));

    if (stdDev1 === 0 || stdDev2 === 0) {
        return 0;
    }

    const correlation = cov / (stdDev1 * stdDev2);
    
    return Math.max(-1, Math.min(1, correlation));
}

router.get('/:ticker', async (req, res) => {
    const { ticker } = req.params;
    const { minutes } = req.query;

    try {
        const data = await fetchStockPriceHistory(ticker, minutes);
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.get('/', async (req, res) => {
    const cacheKey = 'all_stocks';
    const cachedData = cache.get(cacheKey);

    if (cachedData) {
        return res.json(cachedData);
    }

    try {
        BEARER_TOKEN = await fetchNewBearerToken();
        const response = await axios.get(`${STOCK_API_BASE_URL}/stocks`, {
            headers: {
                Authorization: `Bearer ${BEARER_TOKEN}`,
            },
        });
        console.log('All Stocks API Response:', response.data);

        cache.set(cacheKey, response.data);
        res.json(response.data);
    } catch (error) {
        console.error('All Stocks API Error:', error.response ? error.response.data : error.message);
        res.status(500).json({ error: `Failed to fetch stocks: ${error.message}` });
    }
});

router.get('/stocks/stockcorrelation', async (req, res) => {
    const { minutes, ticker } = req.query;
    const [ticker1, ticker2] = ticker;
    
    const correlationCacheKey = `correlation:${ticker1}:${ticker2}:${minutes}`;
    const cachedCorrelation = cache.get(correlationCacheKey);

    if (cachedCorrelation) {
        return res.json(cachedCorrelation);
    }

    try {
        const [stock1Data, stock2Data] = await Promise.all([
            fetchStockPriceHistory(ticker1, minutes),
            fetchStockPriceHistory(ticker2, minutes)
        ]);

        const correlation = calculateCorrelation(stock1Data, stock2Data);
        console.log(`Correlation between ${ticker1} and ${ticker2}:`, correlation);
        const result = {
            correlation,
            stocks: {
                [ticker1]: stock1Data,
                [ticker2]: stock2Data
            }
        };

        cache.set(correlationCacheKey, result);
        res.json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;