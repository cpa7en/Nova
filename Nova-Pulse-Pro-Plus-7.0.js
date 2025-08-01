// ==UserScript==
// @name         Nova Pulse Pro+
// @namespace    https://github.com/
// @version      7.5
// @description  Advanced AI detection with ML & Shockwave Engine
// @author       Hasan Al-Hassi
// @match        https://axiom.trade/*
// @grant        GM_notification
// @grant        GM_addStyle
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_download
// @require      https://cdn.jsdelivr.net/npm/regression@2.0.1/dist/regression.min.js
// @require      https://cdnjs.cloudflare.com/ajax/libs/gsap/3.11.4/gsap.min.js
// @require      https://code.jquery.com/jquery-3.6.0.min.js
// ==/UserScript==

(function() {
    'use strict';

    // Enhanced Accumulation Detection Configuration
    const defaultConfig = {
        // Core Detection Settings
        scanInterval: 500,
        minAccumulationScore: 92,
        volumeSpikeMultiplier: 2.8,
        minWhaleNetFlow: 6000,
        minAccumulationBuy: 120000,
        accumulationRatioThreshold: 3.25,
        whaleActivityThreshold: 6500,
        proTraderMinAmount: 6000,
        clusterTimeWindow: 4500,
        minClusterSize: 5,
        explosionThreshold: 1.028,
        hyperspeedThreshold: 1.012,
        minStrengthDuration: 3200,
        confirmationCandles: 2,
        minVolumeForSignal: 12500,
        cooldownPeriod: 5000,
        volatilityThreshold: 0.15,
        consolidationPeriod: 5,

        // Shockwave Engine Settings
        shockwaveThreshold: 0.85,
        shockwaveDuration: 3000,
        explosionOddsFactor: 0.75,
        maxFalseSignalHistory: 20,
        rsiOverboughtThreshold: 70,
        rsiOversoldThreshold: 30,
        vwapRetestThreshold: 0.01,
        vwapBounceThreshold: 0.005,
        timeframeConvergenceThreshold: 0.7,

        // Scalping Mode Settings
        scalpingMode: true,
        scalpingTimeframe: 5,
        instantBuyPressureThreshold: 0.75,
        minInstantVolumeRatio: 3.0,
        maxHistorySize: 120,

        // Scalping Patterns Thresholds
        microRangeThreshold: 0.008,
        vduSpikeThreshold: 4.5,
        flashAbsorptionRatio: 2.2,
        trapRunVolumeRatio: 3.0,
        shakeoutBarThreshold: 0.05,
        supplyAbsorptionRatio: 1.8,
        volumeStaircaseMinSteps: 3,
        darvasBoxSize: 0.015,
        boxBreakoutThreshold: 1.02,
        hiddenDivergencePeriod: 10,

        // Enhanced Accumulation End Detection
        dumpConfirmationThreshold: 0.60,
        panicSellVolumeMultiplier: 3.0,
        accumulationEndConfirmation: 2.5,
        reassuranceInterval: 10000,

        // Mega Accumulation Settings
        megaAccumulationThreshold: 95,
        megaProTradersThreshold: 15,
        megaBuyVolumeThreshold: 250000,
        megaVolatilityThreshold: 0.08,
        megaPatternWeight: 0.85,
        megaVolumeRatio: 4.2,
        megaAccumulationCooldown: 30000,

        // Nova Pulse Alert Settings
        NovaPulseAlert: true,

        // Instant Explosion Detection Settings
        hyperspeedDetectionWindow: 3,
        hyperspeedConfidenceThreshold: 0.85,
        instantExplosionPredictionSeconds: 3,
        mlSuccessThreshold: 0.02,
        mlEvaluationPeriod: 30000,
        exportHistoryFormat: 'json'
    };

    // Load saved config or use defaults
    let config = { ...defaultConfig };
    const savedConfig = GM_getValue('quantumAccumulationConfig');
    if (savedConfig) {
        config = { ...defaultConfig, ...savedConfig };
    }

    // Enhanced Accumulation Detection Data
    const whaleData = {
        whaleActivity: {
            totalProTraders: 0,
            currentActivity: 'neutral',
            totalBuy: 0,
            totalSell: 0,
            netFlow: 0,
            last50Transactions: [],
            buyPressure: 0,
            sellPressure: 0,
            whaleClusters: [],
            accumulationRatio: 0,
            isAccumulating: false,
            volatilityIndex: 0
        },
        signalConfirmation: {
            streak: 0,
            lastDirection: 'neutral',
            requiredStreak: 3
        },
        signalHistory: [],
        proTraderMomentum: 0,
        recentCluster: false,
        preDetection: false,
        megaAccumulationDetected: false,
        patternRecognition: {
            bullFlag: false,
            cupAndHandle: false,
            fallingWedge: false,
            ascendingTriangle: false,
            doubleBottom: false,
            inverseHeadShoulders: false,
            pennant: false,
            roundingBottom: false,

            // Scalping patterns
            microRangeCompression: false,
            vduSpike: false,
            flashSpikeAbsorption: false,
            trapAndRun: false,
            shakeoutBar: false,
            supplyAbsorption: false,
            volumeStaircase: false,
            darvasBox: false,
            boxBreakoutRetest: false,
            hiddenBullishDivergence: false,
            obvUptrend: false,
            buyWallStack: false,
            vwapRetestSuccess: false,

            // Shockwave Engine patterns
            marubozu: false,
            bullishEngulfing: false,
            bearishEngulfing: false,
            hammer: false,
            invertedHammer: false
        },
        consolidation: {
            detected: false,
            duration: 0,
            startPrice: 0,
            endPrice: 0
        },

        // Scalping specific data
        scalping: {
            lastPrice: 0,
            lastVolume: 0,
            buyPressureHistory: [],
            volumeSpikeHistory: [],
            vwapHistory: [],
            priceRangeHistory: []
        },

        // Shockwave Engine data
        shockwave: {
            explosionOdds: 0,
            falseSignalCount: 0,
            rsiValue: 50,
            vwapValue: 0,
            vwapRetest: false,
            vwapBounce: false,
            timeframeConvergence: false
        }
    };

    // Condition history tracking
    const conditionHistory = {};

    // Initialize condition history
    const conditions = [
        { id: 'pro_trader_buy_volume', label: 'Pro Traders Buys' },
        { id: 'net_whale_flow', label: 'Net Whale Flow' },
        { id: 'obv_spike', label: 'OBV Trend Spike' },
        { id: 'whale_cluster', label: 'Whale Clusters' },
        { id: 'consolidation', label: 'Consolidation' },
        { id: 'pattern_match', label: 'Pattern Match' },
        { id: 'accumulation_pattern', label: 'Accumulation' },
        { id: 'volume_acceleration', label: 'Acceleration' },
        { id: 'instant_buy_pressure', label: 'Buy Pressure' },
        { id: 'volume_spike', label: 'Volume Spike' }
    ];

    conditions.forEach(cond => {
        conditionHistory[cond.id] = { total: 0, success: 0 };
    });

    // Track pro traders history
    let proTradersHistory = [];

    // Track false signals
    let falseSignalHistory = [];

    // Track multi-timeframe data
    const timeframeData = {
        '5s': { prices: [], volumes: [], signals: [], lastUpdate: 0 },
        '15s': { prices: [], volumes: [], signals: [], lastUpdate: 0 },
        '1m': { prices: [], volumes: [], signals: [], lastUpdate: 0 }
    };

    // Machine Learning - Store signal success history
    let signalSuccessHistory = GM_getValue('quantumSignalSuccessHistory', []);
    const mlModel = {
        conditionWeights: GM_getValue('mlConditionWeights', {}),

        // Update weights based on success
        updateWeights: function(success, activeConditions) {
            const learningRate = 0.05;
            const reward = success ? 1 : -1;

            // Update weights for each condition
            Object.keys(activeConditions).forEach(cond => {
                if (!this.conditionWeights[cond]) {
                    this.conditionWeights[cond] = 1.0;
                }

                const conditionActive = activeConditions[cond] ? 1 : 0;
                this.conditionWeights[cond] += learningRate * reward * conditionActive;

                // Keep weights within reasonable bounds
                this.conditionWeights[cond] = Math.max(0.1, Math.min(2.0, this.conditionWeights[cond]));
            });

            // Save updated weights
            GM_setValue('mlConditionWeights', this.conditionWeights);
        },

        // Evaluate signal success after evaluation period
        evaluateSignalSuccess: function(signal) {
            const now = Date.now();
            const evaluationEndTime = signal.time + config.mlEvaluationPeriod;

            // Check if evaluation period has passed
            if (now < evaluationEndTime) return null;

            // Find maximum price during evaluation period
            const evaluationPrices = priceHistory
                .filter(p => p.timestamp > signal.time && p.timestamp <= evaluationEndTime)
                .map(p => p.value);

            if (evaluationPrices.length === 0) return false;

            const maxPrice = Math.max(...evaluationPrices);
            const priceIncrease = (maxPrice - signal.price) / signal.price;

            return priceIncrease >= config.mlSuccessThreshold;
        },

        // Predict instant explosions
        predictInstantExplosion: function(prices) {
            if (prices.length < config.hyperspeedDetectionWindow + 1) return { predicted: false, confidence: 0 };

            const windowSize = config.hyperspeedDetectionWindow;
            const recentPrices = prices.slice(-windowSize - 1);
            const priceChanges = [];

            // Calculate price changes
            for (let i = 1; i < recentPrices.length; i++) {
                const change = (recentPrices[i] - recentPrices[i-1]) / recentPrices[i-1];
                priceChanges.push(change);
            }

            // Calculate acceleration
            const acceleration = [];
            for (let i = 1; i < priceChanges.length; i++) {
                acceleration.push(priceChanges[i] - priceChanges[i-1]);
            }

            // Calculate confidence
            const positiveAcceleration = acceleration.filter(acc => acc > 0);
            const confidence = positiveAcceleration.length > 0 ?
                positiveAcceleration.reduce((sum, acc) => sum + acc, 0) / acceleration.length : 0;

            return {
                predicted: confidence > config.hyperspeedConfidenceThreshold,
                confidence: confidence
            };
        }
    };

    // Advanced AI Learning Engine
    const quantumLearning = {
        successRate: 1.0,
        adjustWeights: function(success) {
            this.successRate = Math.max(0.96, Math.min(1.0, this.successRate + (success ? 0.006 : -0.008)));
        },

        // Shockwave Engine - Calculate explosion odds
        calculateExplosionOdds: function(prices, volumes, transactions) {
            if (prices.length < 10) return 0;

            let odds = 0;

            // Base odds based on accumulation score
            odds += whaleData.shockwave.explosionOdds * 0.3;

            // Volume acceleration factor
            const volumeAcceleration = this.detectVolumeAcceleration(volumes);
            odds += Math.min(0.3, volumeAcceleration * 0.5);

            // Pattern recognition factor
            if (whaleData.patternRecognition.bullFlag ||
                whaleData.patternRecognition.ascendingTriangle ||
                whaleData.patternRecognition.bullishEngulfing) {
                odds += 0.15;
            }

            // VWAP confirmation factor
            if (whaleData.shockwave.vwapRetest && whaleData.shockwave.vwapBounce) {
                odds += 0.15;
            }

            // RSI factor (avoid overbought)
            if (whaleData.shockwave.rsiValue < config.rsiOverboughtThreshold - 10) {
                odds += 0.1;
            } else if (whaleData.shockwave.rsiValue > config.rsiOverboughtThreshold) {
                odds -= 0.2;
            }

            // Reduce odds if recent false signals
            const recentFalseSignals = falseSignalHistory.filter(s => s.time > Date.now() - 60000).length;
            odds -= Math.min(0.2, recentFalseSignals * 0.05);

            return Math.max(0, Math.min(100, odds * 100));
        },

        // Analyze candle patterns
        analyzeCandlePatterns: function(prices, volumes) {
            if (prices.length < 3) return;

            const currentOpen = prices[prices.length - 2];
            const currentClose = prices[prices.length - 1];
            const currentHigh = Math.max(currentOpen, currentClose) + (Math.abs(currentOpen - currentClose) * 0.1);
            const currentLow = Math.min(currentOpen, currentClose) - (Math.abs(currentOpen - currentClose) * 0.1);

            const prevOpen = prices[prices.length - 3];
            const prevClose = prices[prices.length - 2];
            const prevHigh = Math.max(prevOpen, prevClose) + (Math.abs(prevOpen - prevClose) * 0.1);
            const prevLow = Math.min(prevOpen, prevClose) - (Math.abs(prevOpen - prevClose) * 0.1);

            const bodySize = Math.abs(currentOpen - currentClose);
            const totalRange = currentHigh - currentLow;
            const bodyRatio = bodySize / totalRange;

            // Marubozu pattern (long body with little wick)
            whaleData.patternRecognition.marubozu = bodyRatio > 0.9;

            // Bullish Engulfing
            whaleData.patternRecognition.bullishEngulfing =
                currentClose > currentOpen &&
                prevClose < prevOpen &&
                currentOpen < prevClose &&
                currentClose > prevOpen;

            // Bearish Engulfing
            whaleData.patternRecognition.bearishEngulfing =
                currentClose < currentOpen &&
                prevClose > prevOpen &&
                currentOpen > prevClose &&
                currentClose < prevOpen;

            // Hammer
            const lowerWick = currentClose - currentLow;
            const upperWick = currentHigh - currentClose;
            whaleData.patternRecognition.hammer =
                bodyRatio < 0.3 &&
                lowerWick > bodySize * 2 &&
                upperWick < bodySize * 0.5;

            // Inverted Hammer
            whaleData.patternRecognition.invertedHammer =
                bodyRatio < 0.3 &&
                upperWick > bodySize * 2 &&
                lowerWick < bodySize * 0.5;
        },

        // False Signal Filter
        isFalseSignal: function(prices, volumes) {
            // Check if in sideways range
            const recentPrices = prices.slice(-10);
            const maxPrice = Math.max(...recentPrices);
            const minPrice = Math.min(...recentPrices);
            const range = maxPrice - minPrice;
            const avgPrice = recentPrices.reduce((a, b) => a + b, 0) / recentPrices.length;
            const volatility = range / avgPrice;

            if (volatility < config.volatilityThreshold * 0.7) {
                return true; // Sideways market
            }

            // Check RSI overbought
            if (whaleData.shockwave.rsiValue > config.rsiOverboughtThreshold) {
                return true;
            }

            // Check recent explosion
            const recentExplosion = whaleData.signalHistory.some(s =>
                s.type === 'explosion' && Date.now() - s.time < config.cooldownPeriod * 3
            );

            if (recentExplosion) {
                return true;
            }

            return false;
        },

        // VWAP Analysis
        analyzeVWAP: function(prices, volumes) {
            whaleData.shockwave.vwapValue = this.calculateVWAP(prices, volumes);
            const currentPrice = prices[prices.length - 1];
            const prevPrice = prices.length > 1 ? prices[prices.length - 2] : currentPrice;

            // VWAP Retest
            whaleData.shockwave.vwapRetest =
                Math.abs(currentPrice - whaleData.shockwave.vwapValue) < whaleData.shockwave.vwapValue * config.vwapRetestThreshold;

            // VWAP Bounce
            whaleData.shockwave.vwapBounce =
                whaleData.shockwave.vwapRetest &&
                currentPrice > prevPrice &&
                currentPrice > whaleData.shockwave.vwapValue;
        },

        // Timeframe Convergence Analysis
        checkTimeframeConvergence: function() {
            const timeframes = ['5s', '15s', '1m'];
            let convergenceCount = 0;

            for (const timeframe of timeframes) {
                const data = timeframeData[timeframe];
                if (data.signals.length > 0 && data.signals[data.signals.length - 1] === 'bullish') {
                    convergenceCount++;
                }
            }

            whaleData.shockwave.timeframeConvergence =
                convergenceCount / timeframes.length >= config.timeframeConvergenceThreshold;
        },

        // Regression analysis for trend confirmation
        performRegressionAnalysis: function(prices) {
            if (prices.length < 10) return 0;

            const data = prices.map((p, i) => [i, p]);
            const result = regression.linear(data);
            return result.equation[0];
        },

        analyzePatterns: function(prices, volumes) {
            if (prices.length < 20) return;

            const recentPrices = prices.slice(-15);
            const recentVolumes = volumes.slice(-15);

            // Bull flag detection
            const flagPole = recentPrices[7] - recentPrices[0];
            const flag = recentPrices[14] - recentPrices[10];

            if (flagPole > 0 && Math.abs(flag) < flagPole * 0.22 && recentVolumes[0] > recentVolumes[7] * 2.2) {
                whaleData.patternRecognition.bullFlag = true;
            } else {
                whaleData.patternRecognition.bullFlag = false;
            }

            // Cup and handle detection
            const cupDepth = Math.max(...recentPrices.slice(0, 7)) - Math.min(...recentPrices.slice(0, 7));
            const handleDepth = recentPrices[14] - Math.min(...recentPrices.slice(10, 14));

            if (cupDepth > 0 && handleDepth < cupDepth * 0.25 && recentVolumes[14] > recentVolumes[10] * 1.9) {
                whaleData.patternRecognition.cupAndHandle = true;
            } else {
                whaleData.patternRecognition.cupAndHandle = false;
            }

            // Falling wedge detection
            const high1 = Math.max(...recentPrices.slice(0, 3));
            const high2 = Math.max(...recentPrices.slice(5, 8));
            const low1 = Math.min(...recentPrices.slice(0, 3));
            const low2 = Math.min(...recentPrices.slice(5, 8));
            const low3 = Math.min(...recentPrices.slice(10, 13));

            if (high2 < high1 && low2 > low1 && low3 > low2 && recentVolumes[13] > recentVolumes[0] * 1.7) {
                whaleData.patternRecognition.fallingWedge = true;
            } else {
                whaleData.patternRecognition.fallingWedge = false;
            }

            // Ascending triangle detection
            const resistance = Math.max(...recentPrices.slice(0, 5));
            const lows = recentPrices.slice(5).map((p, i) => i > 0 ? Math.min(p, recentPrices[5 + i - 1]) : p);
            const isAscending = lows.every((val, i, arr) => i === 0 || val > arr[i - 1]);

            if (recentPrices.slice(5).every(p => p < resistance) && isAscending && recentVolumes[14] > recentVolumes[5] * 2.0) {
                whaleData.patternRecognition.ascendingTriangle = true;
            } else {
                whaleData.patternRecognition.ascendingTriangle = false;
            }

            // Double Bottom detection
            const minIndex1 = recentPrices.indexOf(Math.min(...recentPrices.slice(0, 5)));
            const minIndex2 = recentPrices.indexOf(Math.min(...recentPrices.slice(6, 10)));

            if (minIndex1 < 5 && minIndex2 > 5 && minIndex2 < 10 &&
                Math.abs(recentPrices[minIndex1] - recentPrices[minIndex2]) < recentPrices[minIndex1] * 0.03 &&
                recentPrices[14] > Math.max(...recentPrices.slice(minIndex1, minIndex2)) &&
                recentVolumes[minIndex2] > recentVolumes[minIndex1] * 1.2) {
                whaleData.patternRecognition.doubleBottom = true;
            } else {
                whaleData.patternRecognition.doubleBottom = false;
            }

            // Inverse Head and Shoulders detection
            const leftShoulderLow = Math.min(...recentPrices.slice(0, 3));
            const headLow = Math.min(...recentPrices.slice(4, 7));
            const rightShoulderLow = Math.min(...recentPrices.slice(8, 11));
            const neckline = (Math.max(...recentPrices.slice(3, 4)) + Math.max(...recentPrices.slice(7, 8))) / 2;

            if (headLow < leftShoulderLow && headLow < rightShoulderLow &&
                Math.abs(leftShoulderLow - rightShoulderLow) < leftShoulderLow * 0.03 &&
                recentPrices[14] > neckline &&
                recentVolumes[10] > recentVolumes[4] * 1.3) {
                whaleData.patternRecognition.inverseHeadShoulders = true;
            } else {
                whaleData.patternRecognition.inverseHeadShoulders = false;
            }

            // Pennant detection
            const poleStart = recentPrices[0];
            const poleEnd = recentPrices[4];
            const poleHeight = Math.abs(poleEnd - poleStart);
            const pennantHighs = recentPrices.slice(5, 10);
            const pennantLows = recentPrices.slice(5, 10);
            const pennantMax = Math.max(...pennantHighs);
            const pennantMin = Math.min(...pennantLows);
            const pennantHeight = pennantMax - pennantMin;

            if (poleHeight > 0 && poleHeight > pennantHeight * 3 &&
                recentVolumes[4] > recentVolumes[0] * 2.5 &&
                recentPrices[14] > pennantMax) {
                whaleData.patternRecognition.pennant = true;
            } else {
                whaleData.patternRecognition.pennant = false;
            }

            // Rounding Bottom detection
            const firstHalf = recentPrices.slice(0, 7);
            const secondHalf = recentPrices.slice(7);
            const firstHalfMin = Math.min(...firstHalf);
            const secondHalfMin = Math.min(...secondHalf);
            const midPoint = recentPrices[7];

            if (firstHalfMin < midPoint && secondHalfMin < midPoint &&
                Math.abs(firstHalfMin - secondHalfMin) < firstHalfMin * 0.05 &&
                recentPrices[14] > midPoint &&
                recentVolumes[14] > recentVolumes[0] * 1.8) {
                whaleData.patternRecognition.roundingBottom = true;
            } else {
                whaleData.patternRecognition.roundingBottom = false;
            }

            // Add candle pattern analysis
            this.analyzeCandlePatterns(prices, volumes);

            // Add VWAP analysis
            this.analyzeVWAP(prices, volumes);

            // Calculate RSI
            const rsiValues = this.calculateRSI(prices, 14);
            whaleData.shockwave.rsiValue = rsiValues.length > 0 ? rsiValues[rsiValues.length - 1] : 50;
        },

        detectConsolidation: function(prices) {
            if (prices.length < config.consolidationPeriod + 2) return;

            const recentPrices = prices.slice(-config.consolidationPeriod - 1);
            const maxPrice = Math.max(...recentPrices);
            const minPrice = Math.min(...recentPrices);
            const range = maxPrice - minPrice;
            const avgPrice = recentPrices.reduce((sum, p) => sum + p, 0) / recentPrices.length;
            const volatility = range / avgPrice;

            if (volatility < config.volatilityThreshold) {
                whaleData.consolidation.detected = true;
                whaleData.consolidation.duration = config.consolidationPeriod;
                whaleData.consolidation.startPrice = recentPrices[0];
                whaleData.consolidation.endPrice = recentPrices[recentPrices.length - 1];
            } else {
                whaleData.consolidation.detected = false;
            }
        },

        detectScalpingPatterns: function(prices, volumes, transactions) {
            if (prices.length < 10) return;

            // Micro Range Compression
            const recentRange = Math.max(...prices.slice(-5)) - Math.min(...prices.slice(-5));
            const prevRange = Math.max(...prices.slice(-10, -5)) - Math.min(...prices.slice(-10, -5));
            whaleData.patternRecognition.microRangeCompression =
                recentRange < (prevRange * config.microRangeThreshold);

            // VDU + Spike
            const currentVolume = volumes[volumes.length - 1];
            const avgVolume = volumes.slice(-10).reduce((a, b) => a + b, 0) / 10;
            whaleData.patternRecognition.vduSpike =
                currentVolume > (avgVolume * config.vduSpikeThreshold) &&
                prices[prices.length - 1] > prices[prices.length - 2];

            // Flash Spike Absorption
            if (volumes.length > 3) {
                const volumeChange = (currentVolume - volumes[volumes.length - 2]) / volumes[volumes.length - 2];
                const priceChange = (prices[prices.length - 1] - prices[prices.length - 2]) / prices[prices.length - 2];
                whaleData.patternRecognition.flashSpikeAbsorption =
                    volumeChange > 1.5 && Math.abs(priceChange) < 0.01;
            }

            // Trap and Run
            whaleData.patternRecognition.trapAndRun =
                prices[prices.length - 3] > prices[prices.length - 2] &&
                prices[prices.length - 1] > prices[prices.length - 3] &&
                volumes[volumes.length - 1] > (volumes[volumes.length - 2] * config.trapRunVolumeRatio);

            // Shakeout Bar
            const high = Math.max(...prices.slice(-3));
            const low = Math.min(...prices.slice(-3));
            whaleData.patternRecognition.shakeoutBar =
                (prices[prices.length - 1] - low) / (high - low) < config.shakeoutBarThreshold;

            // Supply Absorption
            if (transactions.length > 5) {
                const recentSells = transactions.slice(-5).filter(t => t.type === 'Sell').length;
                whaleData.patternRecognition.supplyAbsorption =
                    recentSells > 3 && prices[prices.length - 1] > prices[prices.length - 2];
            }

            // Volume Staircase
            if (volumes.length > config.volumeStaircaseMinSteps + 1) {
                let staircase = true;
                for (let i = 0; i < config.volumeStaircaseMinSteps; i++) {
                    if (volumes[volumes.length - 2 - i] >= volumes[volumes.length - 1 - i]) {
                        staircase = false;
                        break;
                    }
                }
                whaleData.patternRecognition.volumeStaircase = staircase;
            }

            // Darvas Box
            const boxHigh = Math.max(...prices.slice(-5));
            const boxLow = Math.min(...prices.slice(-5));
            whaleData.patternRecognition.darvasBox =
                (boxHigh - boxLow) / boxLow < config.darvasBoxSize;

            // Box Breakout + Retest
            whaleData.patternRecognition.boxBreakoutRetest =
                prices[prices.length - 3] > boxHigh * config.boxBreakoutThreshold &&
                prices[prices.length - 2] < boxHigh &&
                prices[prices.length - 1] > boxHigh;

            // Hidden Bullish Divergence
            if (prices.length > config.hiddenDivergencePeriod) {
                const rsiValues = this.calculateRSI(prices, config.hiddenDivergencePeriod);
                const priceLows = prices.slice(-config.hiddenDivergencePeriod);
                const rsiLows = rsiValues.slice(-config.hiddenDivergencePeriod);

                // Find the two most recent lows in price
                let low1 = Number.MAX_VALUE, low2 = Number.MAX_VALUE;
                let idx1 = -1, idx2 = -1;

                for (let i = priceLows.length - 1; i >= 0; i--) {
                    if (priceLows[i] < low1) {
                        low2 = low1;
                        idx2 = idx1;
                        low1 = priceLows[i];
                        idx1 = i;
                    } else if (priceLows[i] < low2 && i !== idx1) {
                        low2 = priceLows[i];
                        idx2 = i;
                    }
                }

                if (idx1 !== -1 && idx2 !== -1 && idx1 > idx2) {
                    whaleData.patternRecognition.hiddenBullishDivergence =
                        low1 > low2 && rsiLows[idx1] < rsiLows[idx2];
                }
            }

            // OBV Uptrend
            const obv = this.calcOBV(prices, volumes);
            whaleData.patternRecognition.obvUptrend = obv > 0;

            // Buy Wall Stack (simulated)
            whaleData.patternRecognition.buyWallStack =
                transactions.slice(-3).filter(t => t.type === 'Buy').length === 3;

            // VWAP Retest Success (simulated)
            whaleData.patternRecognition.vwapRetestSuccess =
                prices[prices.length - 1] > this.calculateVWAP(prices, volumes) &&
                prices[prices.length - 2] < this.calculateVWAP(prices, volumes);
        },
        calculateRSI: function(prices, period = 14) {
            const rsiValues = [];
            let gains = 0;
            let losses = 0;

            for (let i = 1; i < prices.length; i++) {
                const change = prices[i] - prices[i - 1];

                if (change > 0) {
                    gains += change;
                } else {
                    losses -= change;
                }

                if (i >= period) {
                    const avgGain = gains / period;
                    const avgLoss = losses / period;
                    const rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
                    const rsi = 100 - (100 / (1 + rs));
                    rsiValues.push(rsi);

                    // Remove oldest change
                    const oldChange = prices[i - period + 1] - prices[i - period];
                    if (oldChange > 0) {
                        gains -= oldChange;
                    } else {
                        losses += oldChange;
                    }
                }
            }

            return rsiValues;
        },
        calculateVWAP: function(prices, volumes) {
            if (prices.length === 0 || volumes.length === 0) return 0;

            let cumulativeTPV = 0;
            let cumulativeVolume = 0;

            for (let i = 0; i < prices.length; i++) {
                const typicalPrice = prices[i]; // For simplicity, using price as typical price
                cumulativeTPV += typicalPrice * volumes[i];
                cumulativeVolume += volumes[i];
            }

            return cumulativeVolume > 0 ? cumulativeTPV / cumulativeVolume : 0;
        },
        calcOBV: function(prices, volumes) {
            let obv = 0;
            for (let i = 1; i < prices.length; i++) {
                if (prices[i] > prices[i - 1]) obv += volumes[i];
                else if (prices[i] < prices[i - 1]) obv -= volumes[i];
            }
            return obv;
        },

        detectVolumeAcceleration: function(volumes) {
            if (volumes.length < 4) return 0;

            const currentVolume = volumes[volumes.length - 1];
            const prevVolume = volumes[volumes.length - 2];
            const prevPrevVolume = volumes[volumes.length - 3];
            const prevPrevPrevVolume = volumes[volumes.length - 4];

            const volumeChange1 = (currentVolume - prevVolume) / prevVolume;
            const volumeChange2 = (prevVolume - prevPrevVolume) / prevPrevVolume;
            const volumeChange3 = (prevPrevVolume - prevPrevPrevVolume) / prevPrevPrevVolume;
            const volumeAcceleration = (volumeChange1 + volumeChange2 * 0.7 + volumeChange3 * 0.5) / 2.2;

            return volumeAcceleration;
        }
    };

    // Enhanced UI Styles with Shockwave Engine Elements
    GM_addStyle(`
        .ctm-container {
            position: fixed;
            top: 20px;
            right: 20px;
            background: rgba(10, 12, 18, 0.98);
            border: 1px solid rgba(58, 62, 73, 0.8);
            border-radius: 16px;
            color: #f0f0f0;
            font-family: 'Geist', 'Inter', sans-serif;
            padding: 16px;
            width: 360px;
            z-index: 999999;
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
            user-select: none;
            backdrop-filter: blur(12px);
            cursor: pointer;
            transition: box-shadow 0.3s ease, transform 0.3s ease;
        }

        .ctm-container.dragging {
            box-shadow: 0 12px 40px rgba(0, 255, 136, 0.3);
            transform: scale(1.02);
        }

        .ctm-container.minimized .ctm-header {
            padding: 6px 12px;
            margin-bottom: 4px;
            font-size: 12px;
            border-bottom: none;
        }

        .ctm-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 16px;
            padding-bottom: 12px;
            border-bottom: 1px solid rgba(240, 185, 11, 0.4);
            cursor: pointer;
        }

        .ctm-title {
            font-family: 'Geist';
            font-size: 16px;
            font-weight: 800;
            background: linear-gradient(135deg, #00ff88, #00b3ff);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            display: flex;
            align-items: center;
            gap: 8px;
            letter-spacing: 0.5px;
            text-transform: uppercase;
        }

        .ctm-controls {
            display: flex;
            gap: 8px;
        }

        .ctm-minimize-btn, .ctm-settings-btn {
            width: 24px;
            height: 24px;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 50%;
            background: rgba(255, 255, 255, 0.1);
            cursor: pointer;
            transition: all 0.3s ease;
        }

        .ctm-minimize-btn:hover, .ctm-settings-btn:hover {
            background: rgba(240, 185, 11, 0.3);
        }

        .ctm-minimize-btn svg, .ctm-settings-btn svg {
            width: 14px;
            height: 14px;
            fill: #8b929f;
            transition: fill 0.3s ease;
        }

        .ctm-minimize-btn:hover svg, .ctm-settings-btn:hover svg {
            fill: #f0b90b;
        }

        .ctm-status {
            background: rgba(25, 27, 33, 0.9);
            padding: 14px;
            border-radius: 8px;
            margin-bottom: 16px;
            font-size: 14px;
            border-left: 4px solid transparent;
            box-shadow: inset 0 0 16px rgba(0, 0, 0, 0.3);
            transition: all 0.3s ease;
            line-height: 1.4;
            position: relative;
            overflow: hidden;
        }

        .ctm-status.alert {
            border-left-color: #00ff88;
            background: linear-gradient(90deg, rgba(0, 255, 136, 0.12), transparent);
            animation: pulse-accumulation 1.8s infinite;
        }

        .ctm-status.explosion {
            border-left-color: #ff4d4d;
            background: linear-gradient(90deg, rgba(255, 77, 77, 0.12), transparent);
            animation: pulse-red 0.9s infinite;
        }

        .ctm-status.hyperspeed {
            border-left-color: #0062ff;
            background: linear-gradient(90deg, rgba(0, 98, 255, 0.12), transparent);
            animation: pulse-hyperspeed 0.6s infinite;
        }

        .ctm-status.mega-accumulation {
            border-left-color: #ff8c00;
            background: linear-gradient(90deg, rgba(255, 140, 0, 0.12), transparent);
            animation: pulse-mega 0.7s infinite;
        }

        .ctm-score-container {
            display: flex;
            justify-content: space-between;
            margin-bottom: 10px;
            font-size: 14px;
            font-weight: 600;
        }

        .ctm-score-value {
            font-weight: 800;
            background: linear-gradient(135deg, #00ff88, #00b3ff);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            font-size: 16px;
        }

        .ctm-mega-indicator {
            position: absolute;
            top: -10px;
            right: -10px;
            width: 24px;
            height: 24px;
            background: linear-gradient(135deg, #ff8c00, #ff4500);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            animation: pulse-mega-icon 1.5s infinite;
            box-shadow: 0 0 15px rgba(255, 140, 0, 0.7);
            z-index: 10;
        }

        .ctm-progress-container {
            position: relative;
            height: 20px;
            background: rgba(50, 54, 67, 0.6);
            border-radius: 10px;
            margin-bottom: 18px;
            overflow: hidden;
            box-shadow: inset 0 0 10px rgba(0, 0, 0, 0.5);
        }

        .ctm-progress-bar {
            height: 100%;
            background: linear-gradient(90deg,
                #00ff88,
                #00b3ff,
                #0062ff);
            width: 0%;
            transition: width 0.6s cubic-bezier(0.16, 1, 0.3, 1);
            position: relative;
            border-radius: 10px;
            box-shadow: 0 0 16px rgba(0, 255, 136, 0.5);
            position: relative;
            overflow: hidden;
        }

        .ctm-progress-bar::after {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: linear-gradient(
                90deg,
                rgba(255, 255, 255, 0) 0%,
                rgba(255, 255, 255, 0.3) 50%,
                rgba(255, 255, 255, 0) 100%
            );
            animation: progress-shimmer 1.5s infinite linear;
        }

        .ctm-strength-indicators {
            display: flex;
            justify-content: center;
            gap: 8px;
            margin-bottom: 12px;
            position: relative;
        }

        .ctm-strength-dot {
            width: 12px;
            height: 12px;
            border-radius: 50%;
            background: #3a3e49;
            transition: all 0.3s ease;
        }

        .ctm-strength-dot.active {
            transform: scale(1.2);
            box-shadow: 0 0 8px currentColor;
        }

        .ctm-strength-dot.ctm-strength-low.active {
            background-color: #ff4d4d;
            box-shadow: 0 0 8px #ff4d4d;
        }

        .ctm-strength-dot.ctm-strength-medium.active {
            background-color: #f0b90b;
            box-shadow: 0 0 8px #f0b90b;
        }

        .ctm-strength-dot.ctm-strength-high.active {
            background-color: #00ff88;
            box-shadow: 0 0 8px #00ff88;
        }

        .ctm-strength-medium.active {
            animation: pulse-yellow 1.5s infinite;
        }

        .ctm-strength-high.active {
            animation: pulse-green 1.5s infinite;
        }

        .ctm-conditions {
            margin: 16px 0;
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 12px;
        }

        .ctm-condition {
            display: flex;
            align-items: center;
            font-size: 13px;
            gap: 8px;
            padding: 9px;
            border-radius: 8px;
            background: rgba(25, 27, 33, 0.7);
            transition: all 0.3s ease;
            border: 1px solid rgba(255,255,255,0.06);
            position: relative;
            overflow: visible;
        }

        .ctm-condition .indicator {
            width: 14px;
            height: 14px;
            border-radius: 50%;
            background: #3a3e49;
            flex-shrink: 0;
            transition: all 0.3s ease;
            position: relative;
        }

        .ctm-condition.active .indicator {
            background: #00ff88;
            box-shadow: 0 0 12px rgba(0, 255, 136, 0.7);
        }

        .ctm-condition.active.explosion .indicator {
            background: #ff4d4d;
            box-shadow: 0 0 12px rgba(255, 77, 77, 0.7);
            animation: pulse 1.5s infinite;
        }

        .ctm-condition.active.hyperspeed .indicator {
            background: #0062ff;
            box-shadow: 0 0 12px rgba(0, 98, 255, 0.7);
            animation: pulse-hyperspeed-icon 0.8s infinite;
        }

        .ctm-condition.active.mega .indicator {
            background: #ff8c00;
            box-shadow: 0 0 12px rgba(255, 140, 0, 0.7);
            animation: pulse-mega-icon 1.2s infinite;
        }

        .ctm-condition.active {
            color: #fff;
            font-weight: 700;
            background: rgba(30, 32, 38, 0.9);
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
        }

        .ctm-explosion-meter {
            height: 8px;
            background: rgba(50, 54, 67, 0.6);
            border-radius: 4px;
            margin-top: 16px;
            overflow: hidden;
            box-shadow: inset 0 0 8px rgba(0, 0, 0, 0.4);
        }

        .ctm-explosion-progress {
            height: 100%;
            background: linear-gradient(135deg, #ff4d4d, #ff6b00);
            width: 0%;
            transition: width 0.6s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .ctm-hyperspeed-progress {
            height: 100%;
            background: linear-gradient(135deg, #0062ff, #00b3ff);
            width: 0%;
            transition: width 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .ctm-mega-progress {
            height: 100%;
            background: linear-gradient(135deg, #ff8c00, #ff4500);
            width: 0%;
            transition: width 0.4s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .ctm-accuracy-badge {
            position: absolute;
            top: -6px;
            right: -10px;
            background: linear-gradient(135deg, #ff4d4d, #ff6b00);
            color: white;
            font-size: 10px;
            font-weight: 800;
            padding: 4px 8px;
            border-radius: 12px;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
            z-index: 5;
            transform: rotate(15deg);
            white-space: nowrap;
        }

        .ctm-additional-info {
            font-size: 13px;
            margin-top: 14px;
            color: #8b929f;
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 12px;
        }

        .ctm-info-item {
            display: flex;
            justify-content: space-between;
            padding: 7px 0;
            border-bottom: 1px dashed rgba(139, 146, 159, 0.25);
        }

        .ctm-info-value {
            font-weight: 700;
            color: #00ff88;
        }

        .ctm-info-value.negative {
            color: #ff4d4d;
        }

        .ctm-info-value.mega {
            color: #ff8c00;
            font-weight: 800;
        }

        .ctm-toast {
            position: fixed;
            bottom: 30px;
            right: 30px;
            background: linear-gradient(135deg, rgba(20, 22, 28, 0.98), rgba(30, 32, 38, 0.98));
            border: 1px solid #00ff88;
            color: #fff;
            padding: 16px 18px;
            border-radius: 12px;
            box-shadow: 0 16px 40px rgba(0, 0, 0, 0.6);
            max-width: 320px;
            width: fit-content;
            min-width: 280px;
            z-index: 9999999;
            font-size: 13px;
            width: 300px;
            opacity: 0;
            transform: translateY(20px) scale(0.95);
            transition: all 0.5s cubic-bezier(0.16, 1, 0.3, 1);
            backdrop-filter: blur(14px);
        }

        .ctm-toast.explosion {
            border-color: #ff4d4d;
            background: linear-gradient(135deg, rgba(28, 20, 20, 0.98), rgba(38, 30, 30, 0.98));
            animation: shake 0.5s cubic-bezier(.36,.07,.19,.97) both;
        }

        .ctm-toast.hyperspeed {
            border-color: #0062ff;
            background: linear-gradient(135deg, rgba(20, 20, 28, 0.98), rgba(30, 30, 38, 0.98));
        }

        .ctm-toast.mega {
            border-color: #ff8c00;
            background: linear-gradient(135deg, rgba(28, 20, 10, 0.98), rgba(38, 25, 10, 0.98));
            animation: pulse-mega-toast 1s infinite;
        }

        .ctm-toast.show {
            opacity: 1;
            transform: translateY(0) scale(1);
        }

        .ctm-toast-header {
            display: flex;
            align-items: center;
            gap: 10px;
            margin-bottom: 10px;
            color: #00ff88;
            font-weight: 800;
            font-size: 15px;
        }

        .ctm-toast-header.explosion {
            color: #ff4d4d;
        }

        .ctm-toast-header.hyperspeed {
            color: #0062ff;
        }

        .ctm-toast-header.mega {
            color: #ff8c00;
        }

        .ctm-toast-icon {
            width: 24px;
            height: 24px;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 50%;
            background: rgba(0, 255, 136, 0.2);
        }

        .ctm-toast.explosion .ctm-toast-icon {
            background: rgba(255, 77, 77, 0.2);
        }

        .ctm-toast.hyperspeed .ctm-toast-icon {
            background: rgba(0, 98, 255, 0.2);
        }

        .ctm-toast.mega .ctm-toast-icon {
            background: rgba(255, 140, 0, 0.2);
        }

        .ctm-toast.nova-pro-alert {
            border: 1px solid #00b3ff;
            background-color: #1b1d23;
            border-radius: 12px;
            animation: nova-pulse 2s infinite;
        }

        .ctm-toast.nova-pro-alert div {
            font-size: 14px;
            font-weight: 600;
        }

        .ctm-toast.nova-pro-alert .ctm-toast-header {
            color: #00b3ff;
            background:none;
            font-size: 16px;
            font-weight: 800;
            -webkit-text-fill-color: initial;
            text-align: center;
        }

        .ctm-toast.nova-pro-alert .ctm-toast-icon {
            background: rgba(0, 179, 255, 0.15);
        }

        .ctm-toast.nova-pro-alert .ctm-toast-icon svg {
            fill: #00b3ff;
        }

        .ctm-whale-tooltip {
            position: fixed;
            background: rgba(15, 17, 23, 0.98);
            border: 1px solid rgba(58, 62, 73, 0.8);
            border-radius: 10px;
            padding: 16px;
            width: 280px;
            z-index: 1000000;
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
            backdrop-filter: blur(10px);
            display: none;
            opacity: 0;
            transform: translateY(10px);
            transition: all 0.3s ease;
            pointer-events: none;
        }

        .ctm-whale-tooltip.show {
            display: block;
            opacity: 1;
            transform: translateY(0);
        }

        .ctm-whale-tooltip-header {
            display: flex;
            align-items: center;
            gap: 10px;
            margin-bottom: 14px;
            color: #00ff88;
            font-weight: 700;
            font-size: 15px;
            padding-bottom: 10px;
            border-bottom: 1px solid rgba(58, 62, 73, 0.5);
        }

        .ctm-whale-tooltip-item {
            display: flex;
            justify-content: space-between;
            margin: 8px 0;
            font-size: 13px;
        }

        .ctm-whale-tooltip-label {
            color: #8b929f;
        }

        .ctm-whale-tooltip-value {
            font-weight: 600;
        }

        .ctm-whale-tooltip-value.buy {
            color: #00ff88;
        }

        .ctm-whale-tooltip-value.sell {
            color: #ff4d4d;
        }

        .ctm-whale-tooltip-value.mega {
            color: #ff8c00;
            font-weight: 800;
        }

        .ctm-whale-tooltip-impact {
            margin-top: 14px;
            padding-top: 14px;
            border-top: 1px solid rgba(58, 62, 73, 0.5);
            font-size: 12px;
            color: #8b929f;
            line-height: 1.5;
        }

        /* Enhanced Settings Modal */
        .ctm-settings-modal {
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%) scale(0.9);
            background: rgba(15, 17, 23, 0.98);
            border: 1px solid rgba(58, 62, 73, 0.8);
            border-radius: 16px;
            padding: 20px;
            width: 450px;
            max-width: 90%;
            z-index: 10000000;
            box-shadow: 0 16px 48px rgba(0, 0, 0, 0.7);
            opacity: 0;
            visibility: hidden;
            transition: all 0.3s ease;
            backdrop-filter: blur(16px);
            display: flex;
            flex-direction: column;
            max-height: 90vh;
        }

        .ctm-settings-modal.active {
            opacity: 1;
            visibility: visible;
            transform: translate(-50%, -50%) scale(1);
        }

        .ctm-settings-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 20px;
            padding-bottom: 15px;
            border-bottom: 1px solid rgba(58, 62, 73, 0.5);
        }

        .ctm-settings-title {
            display: flex;
            align-items: center;
            gap: 10px;
            font-size: 18px;
            font-weight: 700;
            background: linear-gradient(135deg, #00ff88, #00b3ff);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
        }

        .ctm-settings-close {
            width: 24px;
            height: 24px;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 50%;
            background: rgba(255, 255, 255, 0.1);
            cursor: pointer;
            transition: all 0.3s ease;
        }

        .ctm-settings-close:hover {
            background: rgba(255, 77, 77, 0.3);
        }

        .ctm-settings-close svg {
            width: 14px;
            height: 14px;
            fill: #8b929f;
            transition: fill 0.3s ease;
        }

        .ctm-settings-close:hover svg {
            fill: #ff4d4d;
        }

        .ctm-settings-content {
            flex: 1;
            overflow-y: auto;
            padding-right: 8px;
            margin-bottom: 20px;
        }

        .ctm-settings-group {
            margin-bottom: 20px;
            background: rgba(25, 27, 33, 0.4);
            border-radius: 10px;
            padding: 15px;
            transition: all 0.3s ease;
        }

        .ctm-settings-group-title {
            font-size: 15px;
            font-weight: 700;
            margin-bottom: 12px;
            padding-bottom: 8px;
            border-bottom: 1px solid rgba(255,255,255,0.1);
            color: #f0b90b;
        }

        .ctm-settings-group:hover {
            background: rgba(30, 32, 38, 0.6);
        }

        .ctm-settings-row {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 8px;
        }

        .ctm-settings-label {
            font-size: 14px;
            color: #8b929f;
            flex: 1;
            min-width: 200px; /* Ensure labels have enough space */
        }

        .ctm-settings-input {
            padding: 8px 12px;
            background: rgba(35, 37, 43, 0.7);
            border: 1px solid rgba(58, 62, 73, 0.5);
            border-radius: 8px;
            color: #fff;
            font-size: 14px;
            transition: border-color 0.3s ease;
            width: 120px;
            text-align: center;
        }

        .ctm-settings-input:focus {
            outline: none;
            border-color: #00ff88;
        }

        .toggle-container {
            display: flex;
            align-items: center;
            margin-bottom: 15px;
            gap: 10px;
        }

        .toggle-switch {
            position: relative;
            display: inline-block;
            width: 50px;
            height: 24px;
        }

        .toggle-switch input {
            opacity: 0;
            width: 0;
            height: 0;
        }

        .toggle-slider {
            position: absolute;
            cursor: pointer;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background-color: rgba(255, 77, 77, 0.3);
            transition: .4s;
            border-radius: 24px;
        }

        .toggle-slider:before {
            position: absolute;
            content: "";
            height: 18px;
            width: 18px;
            left: 3px;
            bottom: 3px;
            background-color: white;
            transition: .4s;
            border-radius: 50%;
        }

        input:checked + .toggle-slider {
            background-color: rgba(0, 255, 136, 0.5);
        }

        input:checked + .toggle-slider:before {
            transform: translateX(26px);
        }

        .ctm-settings-buttons {
            display: flex;
            gap: 12px;
            margin-top: 10px;
            justify-content: center;
        }

        .ctm-settings-save,
        .ctm-settings-reset,
        .ctm-settings-export {
            padding: 20px 28px;
            border-radius: 7px;
            text-align: center;
            font-weight: 700;
            cursor: pointer;
            transition: all 0.3s ease;
            font-size: 14px;
            width: auto;
            min-width: 125px;
        }

        .export-format-row {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 8px;
        }

        .export-format-label {
            font-size: 14px;
            color: #8b929f;
            flex: 1;
            min-width: 200px;
        }

        .export-format-select {
            padding: 8px 12px;
            background: rgba(35, 37, 43, 0.7);
            border: 1px solid rgba(58, 62, 73, 0.5);
            border-radius: 8px;
            color: #fff;
            appearance: none;
            font-size: 14px;
            transition: border-color 0.3s ease;
            width: 120px;
            text-align: center;
        }

        .export-format-select:focus {
            outline: none;
            border-color: #00ff88;
        }

        .ctm-settings-save, .ctm-settings-reset {
            padding: 20px 28px;
            border-radius: 7px;
            text-align: center;
            font-weight: 700;
            cursor: pointer;
            transition: all 0.3s ease;
            font-size: 14px;
            width: auto;
            min-width: 125px;
        }

        .ctm-settings-save {
            background: linear-gradient(135deg, #00ff88, #00b3ff);
            color: #0a0c12;
            border: 1px solid rgba(0, 255, 136, 0.5);
        }

        .ctm-settings-save:hover {
            background: linear-gradient(135deg, #00ff88, #00b3ff);
            box-shadow: 0 0 16px rgba(0, 255, 136, 0.5);
        }

        .ctm-settings-reset {
            background: rgba(255, 77, 77, 0.2);
            color: #ff4d4d;
            border: 1px solid rgba(255, 77, 77, 0.5);
        }

        .ctm-settings-reset:hover {
            background: rgba(255, 77, 77, 0.3);
            box-shadow: 0 0 16px rgba(255, 77, 77, 0.3);
        }

        .ctm-overlay {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.7);
            z-index: 9999999;
            opacity: 0;
            visibility: hidden;
            transition: all 0.3s ease;
        }

        .ctm-overlay.active {
            opacity: 1;
            visibility: visible;
        }

        .ctm-scalping-mode {
            position: absolute;
            top: -8px;
            left: -8px;
            background: linear-gradient(135deg, #ff00cc, #3333ff);
            color: white;
            font-size: 10px;
            font-weight: 800;
            padding: 4px 8px;
            border-radius: 12px;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
            z-index: 10;
            transform: rotate(-5deg);
            white-space: nowrap;
            animation: pulse-scalping 1.5s infinite;
        }

        .ctm-mega-mode {
            position: absolute;
            top: -8px;
            right: -8px;
            background: linear-gradient(135deg, #ff8c00, #ff4500);
            color: white;
            font-size: 10px;
            font-weight: 800;
            padding: 4px 8px;
            border-radius: 12px;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
            z-index: 10;
            transform: rotate(5deg);
            white-space: nowrap;
            animation: pulse-mega-mode 1.5s infinite;
        }

        .ctm-scalping-grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 8px;
            margin-top: 12px;
        }

        .ctm-scalping-pattern {
            background: rgba(30, 15, 40, 0.7);
            border: 1px solid rgba(153, 50, 204, 0.4);
            border-radius: 8px;
            padding: 6px;
            text-align: center;
            font-size: 11px;
            transition: all 0.3s ease;
        }

        .ctm-scalping-pattern.active {
            background: rgba(60, 20, 80, 0.9);
            border-color: #ff00cc;
            color: #ff66ff;
            font-weight: 700;
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(153, 50, 204, 0.3);
        }

        .ctm-strength-badge {
            position: absolute;
            top: -6.5px;
            left: 62.5%;
            background: linear-gradient(135deg, #ff8c00, #ff4500);
            color: white;
            font-size: 10px;
            font-weight: 800;
            padding: 4px 8px;
            border-radius: 12px;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
            z-index: 10;
            white-space: nowrap;
            opacity: 0;
            transition: opacity 0.3s ease;
            transform: none;
            display: flex;
            align-items: center;
            gap: 4px;
        }

        .ctm-strength-badge.show {
            opacity: 1;
        }

        .shockwave-container {
            position: relative;
            height: 30px;
            background: rgba(20, 20, 40, 0.6);
            border-radius: 15px;
            margin: 15px 0;
            overflow: hidden;
            box-shadow: inset 0 0 10px rgba(0, 0, 0, 0.5);
        }

        .shockwave-progress {
            position: absolute;
            height: 100%;
            background: linear-gradient(90deg, #ff00cc, #ff5500);
            width: 0%;
            transition: width 0.5s ease;
            border-radius: 15px;
        }

        .shockwave-label {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: 700;
            font-size: 12px;
            color: white;
            text-shadow: 0 0 5px rgba(0,0,0,0.7);
            z-index: 2;
        }

        .shockwave-ripple {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: radial-gradient(circle, rgba(255,0,204,0.4) 0%, transparent 70%);
            opacity: 0;
            border-radius: 15px;
            animation: shockwave 2s infinite;
        }

        .explosion-odds {
            position: absolute;
            top: -25px;
            right: 10px;
            font-weight: 800;
            font-size: 16px;
            background: linear-gradient(135deg, #ff00cc, #ff5500);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
        }

        .candle-pattern-indicator {
            display: inline-block;
            padding: 4px 8px;
            margin-left: 8px;
            border-radius: 12px;
            font-size: 10px;
            font-weight: 700;
            background: rgba(255, 204, 0, 0.2);
            color: #ffcc00;
        }

        .vwap-indicator {
            display: inline-flex;
            align-items: center;
            padding: 3px 8px;
            border-radius: 10px;
            font-size: 11px;
            font-weight: 700;
            background: rgba(0, 179, 255, 0.15);
            color: #00b3ff;
            margin-top: 5px;
        }

        .timeframe-convergence {
            display: flex;
            justify-content: space-around;
            margin: 10px 0;
            padding: 8px;
            background: rgba(30, 15, 40, 0.3);
            border-radius: 10px;
        }

        .tf-item {
            text-align: center;
            font-size: 11px;
        }

        .tf-label {
            color: #8b929f;
            margin-bottom: 3px;
        }

        .tf-value {
            font-weight: 700;
            color: #00ff88;
        }

        .tf-value.bearish {
            color: #ff4d4d;
        }

        .tf-active {
            animation: pulse-tf 1.5s infinite;
        }

        .shockwave-badge {
            Display: none;
            position: absolute;
            top: -8px;
            left: 50%;
            transform: translateX(-50%);
            background: linear-gradient(135deg, #ff00cc, #ff5500);
            color: white;
            font-size: 10px;
            font-weight: 800;
            padding: 4px 8px;
            border-radius: 12px;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
            z-index: 10;
            white-space: nowrap;
            animation: pulse-scalping 1.5s infinite;
        }

        .ctm-settings-export {
            background: linear-gradient(135deg, #6a11cb, #2575fc) !important;
            color: white !important;
            border: 1px solid rgba(106, 17, 203, 0.5) !important;
        }

        .ctm-settings-export:hover {
            background: linear-gradient(135deg, #7a2bdb, #3585fc) !important;
            box-shadow: 0 0 16px rgba(106, 17, 203, 0.5) !important;
        }

        .ml-badge {
            position: absolute;
            top: -12px;
            right: 135px;
            transform: rotate(-5deg);
            background: linear-gradient(135deg, #ff00cc, #3333ff);
            color: white;
            font-size: 9px;
            font-weight: 800;
            padding: 2px 6px;
            border-radius: 10px;
            z-index: 20;
        }

        .ctm-additional-info .ctm-info-item:nth-child(7),
        .ctm-additional-info .ctm-info-item:nth-child(8),
        .ctm-additional-info .ctm-info-item:nth-child(9) {
         display: none !important;
        }

        @keyframes pulse-accumulation {
            0% { box-shadow: 0 0 0 0 rgba(0, 255, 136, 0.6); }
            70% { box-shadow: 0 0 0 14px rgba(0, 255, 136, 0); }
            100% { box-shadow: 0 0 0 0 rgba(0, 255, 136, 0); }
        }

        @keyframes pulse-red {
            0% { box-shadow: 0 0 0 0 rgba(255, 77, 77, 0.6); }
            70% { box-shadow: 0 0 0 18px rgba(255, 77, 77, 0); }
            100% { box-shadow: 0 0 0 0 rgba(255, 77, 77, 0); }
        }

        @keyframes pulse-hyperspeed {
            0% { box-shadow: 0 0 0 0 rgba(0, 98, 255, 0.6); }
            70% { box-shadow: 0 0 0 18px rgba(0, 98, 255, 0); }
            100% { box-shadow: 0 0 0 0 rgba(0, 98, 255, 0); }
        }

        @keyframes pulse-mega {
            0% { box-shadow: 0 0 0 0 rgba(255, 140, 0, 0.6); }
            70% { box-shadow: 0 0 0 20px rgba(255, 140, 0, 0); }
            100% { box-shadow: 0 0 0 0 rgba(255, 140, 0, 0); }
        }

        @keyframes pulse-hyperspeed-icon {
            0% { transform: scale(1); box-shadow: 0 0 0 0 rgba(0, 98, 255, 0.7); }
            50% { transform: scale(1.4); box-shadow: 0 0 0 10px rgba(0, 98, 255, 0); }
            100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(0, 98, 255, 0); }
        }

        @keyframes pulse-mega-icon {
            0% { transform: scale(1); box-shadow: 0 0 0 0 rgba(255, 140, 0, 0.7); }
            50% { transform: scale(1.5); box-shadow: 0 0 0 12px rgba(255, 140, 0, 0); }
            100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(255, 140, 0, 0); }
        }

        @keyframes pulse-yellow {
            0% { box-shadow: 0 0 0 0 rgba(240, 185, 11, 0.6); }
            70% { box-shadow: 0 0 0 8px rgba(240, 185, 11, 0); }
            100% { box-shadow: 0 0 0 0 rgba(240, 185, 11, 0); }
        }

        @keyframes pulse-green {
            0% { box-shadow: 0 0 0 0 rgba(0, 255, 136, 0.7); }
            70% { box-shadow: 0 0 0 8px rgba(0, 255, 136, 0); }
            100% { box-shadow: 0 0 0 0 rgba(0, 255, 136, 0); }
        }

        @keyframes shake {
            10%, 90% { transform: translate3d(-1px, 0, 0); }
            20%, 80% { transform: translate3d(2px, 0, 0); }
            30%, 50%, 70% { transform: translate3d(-4px, 0, 0); }
            40%, 60% { transform: translate3d(4px, 0, 0); }
        }

        @keyframes pulse-mega-toast {
            0%   { box-shadow: 0 0 0 0 rgba(255, 140, 0, 0.6); }
            70%  { box-shadow: 0 0 0 15px rgba(255, 140, 0, 0); }
            100% { box-shadow: 0 0 0 0 rgba(255, 140, 0, 0); }
        }

        @keyframes progress-shimmer {
            0% { transform: translateX(-100%); }
            100% { transform: translateX(100%); }
        }

        @keyframes pulse-scalping {
            0% { box-shadow: 0 0 0 0 rgba(255, 0, 204, 0.6); }
            70% { box-shadow: 0 0 0 10px rgba(255, 0, 204, 0); }
            100% { box-shadow: 0 0 0 0 rgba(255, 0, 204, 0); }
        }

        @keyframes pulse-mega-mode {
            0% { box-shadow: 0 0 0 0 rgba(255, 140, 0, 0.6); }
            70% { box-shadow: 0 0 0 10px rgba(255, 140, 0, 0); }
            100% { box-shadow: 0 0 0 0 rgba(255, 140, 0, 0); }
        }

        @keyframes nova-pulse {
            0%   { box-shadow: 0 0 0 0 rgba(0, 179, 255, 0.6); }
            70%  { box-shadow: 0 0 0 10px rgba(0, 179, 255, 0); }
            100% { box-shadow: 0 0 0 0 rgba(0, 179, 255, 0); }
        }

        @keyframes shockwave {
            0% { transform: scale(0.8); opacity: 0.8; }
            100% { transform: scale(1.5); opacity: 0; }
        }

        @keyframes pulse-tf {
            0% { transform: scale(1); }
            50% { transform: scale(1.1); }
            100% { transform: scale(1); }
        }
    `);

    // Create main UI Container
    const container = document.createElement('div');
    container.className = 'ctm-container';
    container.innerHTML = `
        <div class="ctm-header">
            <div class="ctm-title">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="#00ff88">
                    <path d="M12 2L15 8L21 9L17 14L18 20L12 17L6 20L7 14L3 9L9 8L12 2Z"/>
                </svg>
                Nova Pulse Pro+ 🩺
            </div>
            <div class="ctm-controls">
                <div class="ctm-settings-btn">
                    <svg viewBox="0 0 24 24">
                        <path d="M12,15.5A3.5,3.5 0 0,1 8.5,12A3.5,3.5 0 0,1 12,8.5A3.5,3.5 0 0,1 15.5,12A3.5,3.5 0 0,1 12,15.5M19.43,12.97C19.47,12.65 19.5,12.33 19.5,12C19.5,11.67 19.47,11.34 19.43,11L21.54,9.37C21.73,9.22 21.78,8.95 21.66,8.73L19.66,5.27C19.54,5.05 19.27,4.96 19.05,5.05L16.56,6.05C16.04,5.66 15.5,5.32 14.87,5.07L14.5,2.42C14.46,2.18 14.25,2 14,2H10C9.75,2 9.54,2.18 9.5,2.42L9.13,5.07C8.5,5.32 7.96,5.66 7.44,6.05L4.95,5.05C4.73,4.96 4.46,5.05 4.34,5.27L2.34,8.73C2.21,8.95 2.27,9.22 2.46,9.37L4.57,11C4.53,11.34 4.5,11.67 4.5,12C4.5,12.33 4.53,12.65 4.57,12.97L2.46,14.63C2.27,14.78 2.21,15.05 2.34,15.27L4.34,18.73C4.46,18.95 4.73,19.03 4.95,18.95L7.44,17.94C7.96,18.34 8.5,18.68 9.13,18.93L9.5,21.58C9.54,21.82 9.75,22 10,22H14C14.25,22 14.46,21.82 14.5,21.58L14.87,18.93C15.5,18.67 16.04,18.34 16.56,17.94L19.05,18.95C19.27,19.03 19.54,18.95 19.66,18.73L21.66,15.27C21.78,15.05 21.73,14.78 21.54,14.63L19.43,12.97Z"/>
                    </svg>
                </div>
                <div class="ctm-minimize-btn">
                    <svg viewBox="0 0 24 24">
                        <path d="M19,13H5V11H19V13Z"></path>
                    </svg>
                </div>
            </div>
        </div>
        <div id="ctm-content">
            <div id="ctm-status" class="ctm-status">Initializing Machine Learning Engine...</div>

            <!-- Shockwave Engine Section -->
            <div class="shockwave-container">
                <div class="shockwave-progress" id="shockwave-progress"></div>
                <div class="shockwave-label">
                    SHOCKWAVE ENGINE
                    <span class="explosion-odds" id="explosion-odds">0%</span>
                </div>
                <div class="shockwave-ripple"></div>
            </div>

            <div class="ctm-score-container">
                <span>ACCUMULATION SCORE</span>
                <span id="ctm-score-value" class="ctm-score-value">0%</span>
            </div>
            <div class="ctm-progress-container">
                <div id="ctm-progress-bar" class="ctm-progress-bar" style="width:0%"></div>
            </div>

            <!-- Timeframe Convergence -->
            <div class="timeframe-convergence">
                <div class="tf-item">
                    <div class="tf-label">5s</div>
                    <div class="tf-value" id="tf-5s">-</div>
                </div>
                <div class="tf-item">
                    <div class="tf-label">15s</div>
                    <div class="tf-value" id="tf-15s">-</div>
                </div>
                <div class="tf-item">
                    <div class="tf-label">1m</div>
                    <div class="tf-value" id="tf-1m">-</div>
                </div>
            </div>

            <div class="ctm-strength-indicators">
                <div class="ctm-strength-dot ctm-strength-low"></div>
                <div class="ctm-strength-dot ctm-strength-medium"></div>
                <div class="ctm-strength-dot ctm-strength-high"></div>
                <div id="ctm-strength-badge" class="ctm-strength-badge">
                    <span>🔥 0%</span>
                </div>
            </div>
            <div id="ctm-conditions" class="ctm-conditions"></div>
            <div class="ctm-explosion-meter">
                <div id="ctm-explosion-progress" class="ctm-explosion-progress"></div>
                <div id="ctm-hyperspeed-progress" class="ctm-hyperspeed-progress"></div>
                <div id="ctm-mega-progress" class="ctm-mega-progress"></div>
            </div>
            <div id="ctm-additional-info" class="ctm-additional-info">
                <div class="ctm-info-item">
                    <span>Pro Traders:</span>
                    <span id="ctm-pro-traders" class="ctm-info-value">-</span>
                </div>
                <div class="ctm-info-item">
                    <span>Net Flow:</span>
                    <span id="ctm-net-flow" class="ctm-info-value">-</span>
                </div>
                <div class="ctm-info-item">
                    <span>Holders:</span>
                    <span id="ctm-holders" class="ctm-info-value">-</span>
                </div>
                <div class="ctm-info-item">
                    <span>Volume:</span>
                    <span id="ctm-volume" class="ctm-info-value">-</span>
                </div>
                <div class="ctm-info-item">
                    <span>Cluster:</span>
                    <span id="ctm-cluster" class="ctm-info-value">-</span>
                </div>
                <div class="ctm-info-item">
                    <span>Pattern:</span>
                    <span id="ctm-pattern" class="ctm-info-value">-</span>
                </div>
                <div class="ctm-info-item">
                    <span>RSI:</span>
                    <span id="ctm-rsi" class="ctm-info-value">-</span>
                </div>
                <div class="ctm-info-item">
                    <span>VWAP:</span>
                    <span id="ctm-vwap" class="ctm-info-value">-</span>
                </div>
                <div class="ctm-info-item">
                    <span>ML Success:</span>
                    <span id="ctm-ml-success" class="ctm-info-value">-</span>
                </div>
            </div>
        </div>
    `;
    document.body.appendChild(container);

    // Add Shockwave Engine indicator
    const shockwaveBadge = document.createElement('div');
    shockwaveBadge.className = 'shockwave-badge';
    shockwaveBadge.textContent = 'SHOCKWAVE ENGINE ACTIVE';
    container.appendChild(shockwaveBadge);

    // Create settings modal
    const settingsModal = document.createElement('div');
    settingsModal.className = 'ctm-settings-modal';
    settingsModal.innerHTML = `
        <div class="ctm-settings-header">
            <div class="ctm-settings-title">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="#00ff88">
                    <path d="M12,15.5A3.5,3.5 0 0,1 8.5,12A3.5,3.5 0 0,1 12,8.5A3.5,3.5 0 0,1 15.5,12A3.5,3.5 0 0,1 12,15.5M19.43,12.97C19.47,12.65 19.5,12.33 19.5,12C19.5,11.67 19.47,11.34 19.43,11L21.54,9.37C21.73,9.22 21.78,8.95 21.66,8.73L19.66,5.27C19.54,5.05 19.27,4.96 19.05,5.05L16.56,6.05C16.04,5.66 15.5,5.32 14.87,5.07L14.5,2.42C14.46,2.18 14.25,2 14,2H10C9.75,2 9.54,2.18 9.5,2.42L9.13,5.07C8.5,5.32 7.96,5.66 7.44,6.05L4.95,5.05C4.73,4.96 4.46,5.05 4.34,5.27L2.34,8.73C2.21,8.95 2.27,9.22 2.46,9.37L4.57,11C4.53,11.34 4.5,11.67 4.5,12C4.5,12.33 4.53,12.65 4.57,12.97L2.46,14.63C2.27,14.78 2.21,15.05 2.34,15.27L4.34,18.73C4.46,18.95 4.73,19.03 4.95,18.95L7.44,17.94C7.96,18.34 8.5,18.68 9.13,18.93L9.5,21.58C9.54,21.82 9.75,22 10,22H14C14.25,22 14.46,21.82 14.5,21.58L14.87,18.93C15.5,18.67 16.04,18.34 16.56,17.94L19.05,18.95C19.27,19.03 19.54,18.95 19.66,18.73L21.66,15.27C21.78,15.05 21.73,14.78 21.54,14.63L19.43,12.97Z"/>
                </svg>
                Advanced Settings
            </div>
            <div class="ctm-settings-close">
                <svg viewBox="0 0 24 24">
                    <path d="M19,6.41L17.59,5L12,10.59L6.41,5L5,6.41L10.59,12L5,17.59L6.41,19L12,13.41L17.59,19L19,17.59L13.41,12L19,6.41Z"/>
                </svg>
            </div>
        </div>
        <div class="ctm-settings-content" id="ctm-settings-content">
            <!-- Settings fields will be generated here -->
        </div>
        <div class="ctm-settings-buttons">
            <div class="ctm-settings-btn ctm-settings-save">Save</div>
            <div class="ctm-settings-btn ctm-settings-reset">Reset</div>
            <div class="ctm-settings-btn ctm-settings-export">Export</div>
        </div>
    `;
    document.body.appendChild(settingsModal);

    // Create overlay for modal
    const overlay = document.createElement('div');
    overlay.className = 'ctm-overlay';
    document.body.appendChild(overlay);

    // Enhanced Whale/Pro Trader Tooltip
    const whaleTooltip = document.createElement('div');
    whaleTooltip.className = 'ctm-whale-tooltip';
    whaleTooltip.innerHTML = `
        <div class="ctm-whale-tooltip-header">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="#00ff88">
                <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 10.99h7c-.53 4.12-3.28 7.79-7 8.94V12H5V6.3l7-3.11v8.8z"/>
            </svg>
            Smart Money Insights
        </div>
        <div class="ctm-whale-tooltip-item">
            <span class="ctm-whale-tooltip-label">Total Buy:</span>
            <span id="whale-tooltip-total-buy" class="ctm-whale-tooltip-value buy">$0</span>
        </div>
        <div class="ctm-whale-tooltip-item">
            <span class="ctm-whale-tooltip-label">Total Sell:</span>
            <span id="whale-tooltip-total-sell" class="ctm-whale-tooltip-value sell">$0</span>
        </div>
        <div class="ctm-whale-tooltip-item">
            <span class="ctm-whale-tooltip-label">Net Flow:</span>
            <span id="whale-tooltip-net-flow" class="ctm-whale-tooltip-value">$0</span>
        </div>
        <div class="ctm-whale-tooltip-item">
            <span class="ctm-whale-tooltip-label">Pro Traders:</span>
            <span id="whale-tooltip-total" class="ctm-whale-tooltip-value">0</span>
        </div>
        <div class="ctm-whale-tooltip-item">
            <span class="ctm-whale-tooltip-label">Holders:</span>
            <span id="whale-tooltip-holders" class="ctm-whale-tooltip-value">0</span>
        </div>
        <div class="ctm-whale-tooltip-item">
            <span class="ctm-whale-tooltip-label">Current Status:</span>
            <span id="whale-tooltip-current" class="ctm-whale-tooltip-value">Neutral</span>
        </div>
        <div class="ctm-whale-tooltip-item">
            <span class="ctm-whale-tooltip-label">ML Success Rate:</span>
            <span id="whale-tooltip-ml" class="ctm-whale-tooltip-value">-</span>
        </div>
    `;
    document.body.appendChild(whaleTooltip);

    // Tooltip hover functionality
    const statusElement = document.getElementById('ctm-status');
    if (statusElement) {
        statusElement.addEventListener('mouseenter', () => {
            whaleTooltip.classList.add('show');
            updateTooltipPosition();
        });

        statusElement.addEventListener('mouseleave', () => {
            whaleTooltip.classList.remove('show');
        });
    }

    // Update tooltip position relative to container
    function updateTooltipPosition() {
        const containerRect = container.getBoundingClientRect();
        const statusRect = statusElement.getBoundingClientRect();

        // Position to the right of the container
        let left = containerRect.right + 10;

        // If it would go off-screen, position to the left
        if (left + whaleTooltip.offsetWidth > window.innerWidth) {
            left = containerRect.left - whaleTooltip.offsetWidth - 10;
        }

        whaleTooltip.style.left = `${left}px`;
        whaleTooltip.style.top = `${statusRect.top}px`;
    }

    // Make container draggable
    let isDragging = false;
    let dragOffsetX, dragOffsetY;
    const header = container.querySelector('.ctm-header');

    function startDrag(e) {
        if (e.target.closest('.ctm-minimize-btn') || e.target.closest('.ctm-settings-btn')) return;

        isDragging = true;
        container.classList.add('dragging');
        dragOffsetX = e.clientX - container.getBoundingClientRect().left;
        dragOffsetY = e.clientY - container.getBoundingClientRect().top;
        e.preventDefault();
    }

    function dragMove(e) {
        if (!isDragging) return;

        container.style.left = `${e.clientX - dragOffsetX}px`;
        container.style.top = `${e.clientY - dragOffsetY}px`;
        container.style.right = 'auto';

        // Update tooltip position if visible
        if (whaleTooltip.classList.contains('show')) {
            updateTooltipPosition();
        }
    }

    function endDrag() {
        isDragging = false;
        container.classList.remove('dragging');
        GM_setValue('widgetPosition', {
            left: container.style.left,
            top: container.style.top
        });
    }

    container.addEventListener('mousedown', startDrag);
    document.addEventListener('mousemove', dragMove);
    document.addEventListener('mouseup', endDrag);

    // Load saved position
    const savedPosition = GM_getValue('widgetPosition');
    if (savedPosition) {
        container.style.left = savedPosition.left;
        container.style.top = savedPosition.top;
        container.style.right = 'auto';
    }

    // Minimize/Restore button functionality
    const minimizeBtn = container.querySelector('.ctm-minimize-btn');
    const settingsBtn = container.querySelector('.ctm-settings-btn');
    const content = document.getElementById('ctm-content');
    let isMinimized = GM_getValue('widgetMinimized', false);

    // Initialize minimized state
    if (isMinimized) {
        content.style.display = 'none';
        minimizeBtn.innerHTML = `<svg viewBox="0 0 24 24"><path d="M19,11H5V13H19V11Z"/></svg>`;
        container.classList.add('minimized');
    }

    minimizeBtn.addEventListener('click', () => {
        if (content.style.display === 'none') {
            // Restore
            content.style.display = 'block';
            minimizeBtn.innerHTML = `<svg viewBox="0 0 24 24"><path d="M19,13H5V11H19V13Z"/></svg>`;
            isMinimized = false;
            container.classList.remove('minimized');
        } else {
            // Minimize
            content.style.display = 'none';
            minimizeBtn.innerHTML = `<svg viewBox="0 0 24 24"><path d="M19,11H5V13H19V11Z"/></svg>`;
            isMinimized = true;
            container.classList.add('minimized');
        }
        GM_setValue('widgetMinimized', isMinimized);
    });

    // Settings button functionality
    settingsBtn.addEventListener('click', () => {
        overlay.classList.add('active');
        settingsModal.classList.add('active');
        generateSettingsFields();
    });

    // Settings close button
    const settingsCloseBtn = settingsModal.querySelector('.ctm-settings-close');
    settingsCloseBtn.addEventListener('click', () => {
        overlay.classList.remove('active');
        settingsModal.classList.remove('active');
    });

    // Overlay click to close modal
    overlay.addEventListener('click', () => {
        overlay.classList.remove('active');
        settingsModal.classList.remove('active');
    });

    // Generate settings fields
    function generateSettingsFields() {
        const settingsContent = document.getElementById('ctm-settings-content');
        settingsContent.innerHTML = '';

        // Core Detection Settings
        const coreGroup = document.createElement('div');
        coreGroup.className = 'ctm-settings-group';
        coreGroup.innerHTML = '<div class="ctm-settings-group-title">CORE DETECTION SETTINGS</div>';

        const coreSettings = [
            { key: 'scanInterval', label: 'Scan Interval (ms)' },
            { key: 'minAccumulationScore', label: 'Min Score' },
            { key: 'volumeSpikeMultiplier', label: 'Vol Spike Mult' },
            { key: 'minWhaleNetFlow', label: 'Min Net Flow' },
            { key: 'minAccumulationBuy', label: 'Min Buy Vol' },
            { key: 'accumulationRatioThreshold', label: 'Accum Ratio' },
            { key: 'whaleActivityThreshold', label: 'Whale Activity' },
            { key: 'proTraderMinAmount', label: 'Pro Min Amount' },
            { key: 'clusterTimeWindow', label: 'Cluster Time (ms)' },
            { key: 'minClusterSize', label: 'Min Cluster' },
            { key: 'explosionThreshold', label: 'Explosion Thresh' },
            { key: 'hyperspeedThreshold', label: 'Hyperspeed Thresh' },
            { key: 'minStrengthDuration', label: 'Strength Duration' },
            { key: 'confirmationCandles', label: 'Confirm Candles' },
            { key: 'minVolumeForSignal', label: 'Min Volume' },
            { key: 'cooldownPeriod', label: 'Cooldown (ms)' },
            { key: 'volatilityThreshold', label: 'Volatility Thresh' },
            { key: 'consolidationPeriod', label: 'Consolidation' }
        ];

        coreSettings.forEach(item => {
            const row = document.createElement('div');
            row.className = 'ctm-settings-row';

            const label = document.createElement('div');
            label.className = 'ctm-settings-label';
            label.textContent = item.label;

            const input = document.createElement('input');
            input.className = 'ctm-settings-input';
            input.type = 'number';
            input.step = item.key.includes('Threshold') || item.key.includes('Ratio') ? '0.01' : '1';
            input.value = config[item.key];
            input.dataset.key = item.key;

            row.appendChild(label);
            row.appendChild(input);
            coreGroup.appendChild(row);
        });

        settingsContent.appendChild(coreGroup);

        // Scalping Mode Settings
        const scalpingGroup = document.createElement('div');
        scalpingGroup.className = 'ctm-settings-group';
        scalpingGroup.innerHTML = '<div class="ctm-settings-group-title">SCALPING MODE SETTINGS</div>';

        const scalpingSettings = [
            { key: 'scalpingMode', label: 'Scalping Mode' },
            { key: 'scalpingTimeframe', label: 'Timeframe' },
            { key: 'instantBuyPressureThreshold', label: 'Buy Pressure Thresh' },
            { key: 'minInstantVolumeRatio', label: 'Min Vol Ratio' },
            { key: 'maxHistorySize', label: 'Max History' },
            { key: 'microRangeThreshold', label: 'Micro Range Thresh' },
            { key: 'vduSpikeThreshold', label: 'VDU Spike Thresh' },
            { key: 'flashAbsorptionRatio', label: 'Flash Absorb Ratio' },
            { key: 'trapRunVolumeRatio', label: 'Trap Run Ratio' },
            { key: 'shakeoutBarThreshold', label: 'Shakeout Thresh' },
            { key: 'supplyAbsorptionRatio', label: 'Supply Absorb Ratio' },
            { key: 'volumeStaircaseMinSteps', label: 'Vol Stairs Steps' },
            { key: 'darvasBoxSize', label: 'Darvas Box Size' },
            { key: 'boxBreakoutThreshold', label: 'Box Breakout Thresh' },
            { key: 'hiddenDivergencePeriod', label: 'Divergence Period' }
        ];

        scalpingSettings.forEach(item => {
            const row = document.createElement('div');
            row.className = 'ctm-settings-row';

            const label = document.createElement('div');
            label.className = 'ctm-settings-label';
            label.textContent = item.label;

            if (item.key === 'scalpingMode') {
                const toggleContainer = document.createElement('div');
                toggleContainer.className = 'toggle-container';

                const toggleSwitch = document.createElement('label');
                toggleSwitch.className = 'toggle-switch';
                toggleSwitch.innerHTML = `
                    <input type="checkbox" class="ctm-settings-input" data-key="${item.key}" ${config[item.key] ? 'checked' : ''}>
                    <span class="toggle-slider"></span>
                `;

                toggleContainer.appendChild(label);
                toggleContainer.appendChild(toggleSwitch);
                scalpingGroup.appendChild(toggleContainer);
            } else {
                const input = document.createElement('input');
                input.className = 'ctm-settings-input';
                input.type = 'number';
                input.step = item.key.includes('Threshold') || item.key.includes('Ratio') ? '0.01' : '1';
                input.value = config[item.key];
                input.dataset.key = item.key;

                row.appendChild(label);
                row.appendChild(input);
                scalpingGroup.appendChild(row);
            }
        });

        settingsContent.appendChild(scalpingGroup);

        // Accumulation End Detection
        const accumulationGroup = document.createElement('div');
        accumulationGroup.className = 'ctm-settings-group';
        accumulationGroup.innerHTML = '<div class="ctm-settings-group-title">ACCUMULATION END DETECTION</div>';

        const accumulationSettings = [
            { key: 'dumpConfirmationThreshold', label: 'Dump Threshold' },
            { key: 'panicSellVolumeMultiplier', label: 'Panic Sell Mult' },
            { key: 'accumulationEndConfirmation', label: 'End Confirmation' },
            { key: 'reassuranceInterval', label: 'Reassurance Intvl' },
        ];

        accumulationSettings.forEach(item => {
            const row = document.createElement('div');
            row.className = 'ctm-settings-row';

            const label = document.createElement('div');
            label.className = 'ctm-settings-label';
            label.textContent = item.label;

            const input = document.createElement('input');
            input.className = 'ctm-settings-input';
            input.type = 'number';
            input.step = item.key.includes('Threshold') || item.key.includes('Ratio') ? '0.01' : '1';
            input.value = config[item.key];
            input.dataset.key = item.key;

            row.appendChild(label);
            row.appendChild(input);
            accumulationGroup.appendChild(row);
        });

        settingsContent.appendChild(accumulationGroup);

        // Mega Accumulation Settings
        const megaGroup = document.createElement('div');
        megaGroup.className = 'ctm-settings-group';
        megaGroup.innerHTML = '<div class="ctm-settings-group-title">MEGA ACCUMULATION DETECTION</div>';

        const megaSettings = [
            { key: 'megaAccumulationThreshold', label: 'Mega Score' },
            { key: 'megaProTradersThreshold', label: 'Pro Traders' },
            { key: 'megaBuyVolumeThreshold', label: 'Buy Volume' },
            { key: 'megaVolatilityThreshold', label: 'Volatility Thresh' },
            { key: 'megaPatternWeight', label: 'Pattern Weight' },
            { key: 'megaVolumeRatio', label: 'Volume Ratio' },
            { key: 'megaAccumulationCooldown', label: 'Cooldown (ms)' }
        ];

        megaSettings.forEach(item => {
            const row = document.createElement('div');
            row.className = 'ctm-settings-row';

            const label = document.createElement('div');
            label.className = 'ctm-settings-label';
            label.textContent = item.label;

            const input = document.createElement('input');
            input.className = 'ctm-settings-input';
            input.type = 'number';
            input.step = item.key.includes('Threshold') || item.key.includes('Ratio') || item.key.includes('Weight') ? '0.01' : '1';
            input.value = config[item.key];
            input.dataset.key = item.key;

            row.appendChild(label);
            row.appendChild(input);
            megaGroup.appendChild(row);
        });

        settingsContent.appendChild(megaGroup);

        // Instant Explosion Settings
        const instantGroup = document.createElement('div');
        instantGroup.className = 'ctm-settings-group';
        instantGroup.innerHTML = '<div class="ctm-settings-group-title">INSTANT EXPLOSION DETECTION</div>';

        const instantSettings = [
            { key: 'hyperspeedDetectionWindow', label: 'Detection Window' },
            { key: 'hyperspeedConfidenceThreshold', label: 'Confidence Thresh' },
            { key: 'instantExplosionPredictionSeconds', label: 'Prediction Seconds' },
            { key: 'mlSuccessThreshold', label: 'ML Success Thresh' },
            { key: 'mlEvaluationPeriod', label: 'ML Eval Period (ms)' }
        ];

        instantSettings.forEach(item => {
            const row = document.createElement('div');
            row.className = 'ctm-settings-row';

            const label = document.createElement('div');
            label.className = 'ctm-settings-label';
            label.textContent = item.label;

            const input = document.createElement('input');
            input.className = 'ctm-settings-input';
            input.type = 'number';
            input.step = item.key.includes('Threshold') || item.key.includes('Seconds') ? '0.01' : '1';
            input.value = config[item.key];
            input.dataset.key = item.key;

            row.appendChild(label);
            row.appendChild(input);
            instantGroup.appendChild(row);
        });

        // Export Format Setting
        const exportRow = document.createElement('div');
        exportRow.className = 'export-format-row';

        const exportLabel = document.createElement('div');
        exportLabel.className = 'export-format-label';
        exportLabel.textContent = 'Export Format';

        const select = document.createElement('select');
        select.className = 'export-format-select';
        select.dataset.key = 'exportHistoryFormat';

        const optionJson = document.createElement('option');
        optionJson.value = 'json';
        optionJson.textContent = 'JSON';
        optionJson.selected = config.exportHistoryFormat === 'json';

        const optionCsv = document.createElement('option');
        optionCsv.value = 'csv';
        optionCsv.textContent = 'CSV';
        optionCsv.selected = config.exportHistoryFormat === 'csv';

        select.appendChild(optionJson);
        select.appendChild(optionCsv);

        exportRow.appendChild(exportLabel);
        exportRow.appendChild(select);
        instantGroup.appendChild(exportRow);

        settingsContent.appendChild(instantGroup);

        // Nova Pulse Alert Settings (Moved to the end)
        const novaAlertGroup = document.createElement('div');
        novaAlertGroup.className = 'ctm-settings-group';
        novaAlertGroup.innerHTML = '<div class="ctm-settings-group-title">NOVA PULSE ALERT</div>';

        const novaAlertSettings = [
        { key: 'NovaPulseAlert', label: 'Nova Pulse Alert' }
        ];

        novaAlertSettings.forEach(setting => {
        const row = document.createElement('div');
        row.className = 'ctm-settings-row toggle-container';

        const label = document.createElement('label');
        label.className = 'ctm-settings-label';
        label.textContent = setting.label;

        const toggle = document.createElement('label');
        toggle.className = 'toggle-switch';

        const input = document.createElement('input');
        input.type = 'checkbox';
        input.checked = config[setting.key];
        input.dataset.key = setting.key;

        const slider = document.createElement('span');
        slider.className = 'toggle-slider';

        toggle.appendChild(input);
        toggle.appendChild(slider);

        row.appendChild(label);
        row.appendChild(toggle);
        novaAlertGroup.appendChild(row);
        });

        settingsContent.appendChild(novaAlertGroup);
    }

    // Save settings
    const saveBtn = settingsModal.querySelector('.ctm-settings-save');
    saveBtn.addEventListener('click', () => {
        const inputs = settingsModal.querySelectorAll('.ctm-settings-input, select');

        inputs.forEach(input => {
            const key = input.dataset.key;
            if (input.type === 'checkbox') {
                config[key] = input.checked;
            } else if (input.tagName === 'SELECT') {
                config[key] = input.value;
            } else {
                config[key] = parseFloat(input.value);
            }
        });

        GM_setValue('quantumAccumulationConfig', config);
        overlay.classList.remove('active');
        settingsModal.classList.remove('active');

        // Show confirmation
        const toast = document.createElement('div');
        toast.className = 'ctm-toast show';
        toast.innerHTML = `
            <div class="ctm-toast-header">
                <div class="ctm-toast-icon">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="#00ff88">
                        <path d="M21,7L9,19L3.5,13.5L4.91,12.09L9,16.17L19.59,5.59L21,7Z"/>
                    </svg>
                </div>
                <span>SETTINGS SAVED</span>
            </div>
            <div class="ctm-toast-detail">
                <span>Configuration updated successfully</span>
            </div>
        `;
        document.body.appendChild(toast);

        setTimeout(() => {
            toast.remove();
        }, 3000);
    });

    // Reset settings
    const resetBtn = settingsModal.querySelector('.ctm-settings-reset');
    resetBtn.addEventListener('click', () => {
        config = { ...defaultConfig };
        GM_setValue('quantumAccumulationConfig', config);
        generateSettingsFields();

        // Show confirmation
        const toast = document.createElement('div');
        toast.className = 'ctm-toast show';
        toast.innerHTML = `
            <div class="ctm-toast-header">
                <div class="ctm-toast-icon">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="#00ff88">
                        <path d="M13.5,8H12V13L16.28,15.54L17,14.33L13.5,12.25V8M13,3A9,9 0 0,0 4,12H1L4.96,16.03L9,12H6A7,7 0 0,1 13,5A7,7 0 0,1 20,12A7,7 0 0,1 13,19C11.07,19 9.32,18.21 8.06,16.94L6.64,18.36C8.27,20 10.5,21 13,21A9,9 0 0,0 22,12A9,9 0 0,0 13,3"/>
                    </svg>
                </div>
                <span>SETTINGS RESET</span>
            </div>
            <div class="ctm-toast-detail">
                <span>All settings restored to default</span>
            </div>
        `;
        document.body.appendChild(toast);

        setTimeout(() => {
            toast.remove();
        }, 3000);
    });

    // Export history
    const exportBtn = settingsModal.querySelector('.ctm-settings-export');
    exportBtn.addEventListener('click', () => {
        const history = GM_getValue('quantumSignalSuccessHistory', []);
        const format = config.exportHistoryFormat || 'json';

        if (format === 'json') {
            const dataStr = JSON.stringify(history, null, 2);
            const blob = new Blob([dataStr], {type: 'application/json'});
            const url = URL.createObjectURL(blob);

            GM_download({
                url: url,
                name: 'quantum_signal_history.json',
                saveAs: true
            });
        } else {
            // CSV format
            let csv = 'Time,Price,Type,Success,Confidence\n';
            history.forEach(entry => {
                csv += `${new Date(entry.time).toISOString()},${entry.price},${entry.type},${entry.success},${entry.confidence}\n`;
            });

            const blob = new Blob([csv], {type: 'text/csv'});
            const url = URL.createObjectURL(blob);

            GM_download({
                url: url,
                name: 'quantum_signal_history.csv',
                saveAs: true
            });
        }

        // Show export confirmation
        const toast = document.createElement('div');
        toast.className = 'ctm-toast show';
        toast.innerHTML = `
            <div class="ctm-toast-header">
                <div class="ctm-toast-icon">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="#00ff88">
                        <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/>
                    </svg>
                </div>
                <span>HISTORY EXPORTED</span>
            </div>
            <div class="ctm-toast-detail">
                <span>Signal history saved successfully</span>
            </div>
        `;
        document.body.appendChild(toast);
        setTimeout(() => toast.remove(), 3000);
    });

    // Add conditions to UI
    const conditionsContainer = document.getElementById('ctm-conditions');
    conditions.forEach(cond => {
        const el = document.createElement('div');
        el.className = 'ctm-condition';
        el.id = `ctm-cond-${cond.id}`;
        el.innerHTML = `
            <div class="indicator"></div>
            <span>${cond.label}</span>
        `;
        conditionsContainer.appendChild(el);
    });

    // Update condition performance UI
    function updateConditionPerformanceUI() {
        // Remove previous badges
        document.querySelectorAll('.ctm-accuracy-badge').forEach(el => el.remove());

        // Find top performing condition in last 20 trades
        let topCondition = null;
        let maxAccuracy = 0;

        Object.keys(conditionHistory).forEach(condId => {
            const stats = conditionHistory[condId];
            if (stats.total >= 5) { // Only consider conditions with enough data
                const accuracy = stats.success / stats.total;
                if (accuracy > maxAccuracy) {
                    maxAccuracy = accuracy;
                    topCondition = condId;
                }
            }
        });

        if (topCondition) {
            const conditionElement = document.getElementById(`ctm-cond-${topCondition}`);
            if (conditionElement) {
                const badge = document.createElement('div');
                badge.className = 'ctm-accuracy-badge';
                badge.textContent = `🔥 ${(maxAccuracy * 100).toFixed(0)}%`;
                badge.title = `Highest accuracy in last ${conditionHistory[topCondition].total} signals`;
                conditionElement.appendChild(badge);
            }
        }
    }

    // Simulate condition history for demonstration
    conditions.forEach(cond => {
        conditionHistory[cond.id] = {
            total: Math.floor(Math.random() * 20) + 5,
            success: Math.floor(Math.random() * 18) + 3
        };
    });

    // Data storage
    const priceHistory = [];
    const volumeHistory = [];
    const holderHistory = [];
    let lastSignalTime = 0;
    let breakoutPrice = 0;
    let explosionDetected = false;
    let hyperspeedDetected = false;
    let megaAccumulationDetected = false;
    let explosionStartTime = 0;
    let hyperspeedStartTime = 0;
    let megaAccumulationStartTime = 0;
    let currentStrength = 0;
    let hyperspeedStrength = 0;
    let maxStrengthReached = 0;
    let maxHyperspeedStrength = 0;
    let confirmedSignals = 0;
    let successfulSignals = 0;
    let inTrade = false;
    let accumulationEndCounter = 0;
    let tradeStartTime = 0;
    let accumulationActive = false;
    let lastScalpingUpdate = 0;
    let lastReassuranceTime = 0;
    let accumulationEndAlertActive = false;
    let accumulationEndAlertCount = 0;
    let accumulationEndLastAlertTime = 0;
    let lastMegaAccumulationTime = 0;

    // Helper functions
    function isCoinPage() {
        return /^https:\/\/axiom\.trade\/meme\/[a-zA-Z0-9]+$/.test(location.href);
    }

    function parseNum(str) {
        if (!str) return 0;
        const num = parseFloat(str.replace(/[^\d.\-]/g, ''));
        if (str.includes('K')) return num * 1e3;
        if (str.includes('M')) return num * 1e6;
        if (str.includes('B')) return num * 1e9;
        return num || 0;
    }

    function formatNumber(num) {
        if (num >= 1e6) {
            const formatted = (num / 1e6).toFixed(2);
            return cleanDecimal(formatted) + 'M';
        }
        if (num >= 1e3) {
            const formatted = (num / 1e3).toFixed(2);
            return cleanDecimal(formatted) + 'K';
        }
        const formatted = num.toFixed(2);
        return cleanDecimal(formatted);
    }

    function cleanDecimal(str) {
        if (typeof str !== 'string') {
            str = str.toString();
        }
        if (str.indexOf('.') === -1) {
            return str;
        }
        return str.replace(/\.0+$/, '').replace(/(\..\d)0+$/, '$1');
    }

    function getMarketCap() {
        const marketCapSpan = Array.from(document.querySelectorAll("span"))
            .find(el => el.textContent.trim().startsWith("$") &&
                 el.textContent.trim().match(/^\$\d+(\.\d+)?[KMB]?$/));
        return marketCapSpan ? parseNum(marketCapSpan.textContent.trim()) : 0;
    }

    function getPrice() {
        const marketCap = getMarketCap();
        return marketCap / 1e9;
    }

    function getVolume() {
        const label = Array.from(document.querySelectorAll("span"))
            .find(el => el.textContent.trim() === "5m Vol");
        const text = label?.parentElement?.querySelectorAll("span")[1]?.textContent.trim();
        return text ? parseNum(text) : 0;
    }

    function getDataByLabel(labelText) {
        const allBoxes = document.querySelectorAll('div.border.border-primaryStroke\\/50');
        for (const box of allBoxes) {
            if (box.innerText.includes(labelText)) {
                const numberSpan = box.querySelector('span.text-\\[14px\\]');
                if (numberSpan) return parseNum(numberSpan.textContent.trim());
            }
        }
        return 0;
    }

    function extractInvestmentAmountsWithTimestamp() {
        const rows = document.querySelectorAll('div.relative.flex.flex-row.w-full');

        const buys = [];
        const sells = [];
        const transactions = [];

        rows.forEach(row => {
            const columns = row.querySelectorAll('div.flex.flex-1');
            if (columns.length < 1) return;

            const amountColumn = columns[0];
            const span = amountColumn.querySelector('span.text-increase, span.text-decrease');
            if (!span) return;

            let rawText = span.textContent.trim();
            let multiplier = 1;
            if (rawText.includes('K')) {
                multiplier = 1000;
                rawText = rawText.replace('K', '');
            } else if (rawText.includes('M')) {
                multiplier = 1000000;
                rawText = rawText.replace('M', '');
            }
            const value = parseFloat(rawText.replace(/[^0-9.]/g, '')) * multiplier;
            if (isNaN(value)) return;

            let type = '';
            if (span.classList.contains('text-increase')) {
                type = 'Buy';
                buys.push(value);
            } else if (span.classList.contains('text-decrease')) {
                type = 'Sell';
                sells.push(value);
            }

            transactions.push({
                type,
                value,
                detectedTime: Date.now()
            });
        });

        const totalBuy = buys.reduce((a, b) => a + b, 0);
        const totalSell = sells.reduce((a, b) => a + b, 0);
        const netFlow = totalBuy - totalSell;

        return {
            totalBuy,
            totalSell,
            netFlow,
            last50Transactions: transactions.slice(0, 50)
        };
    }

    function extractInvestmentStats() {
        const holders = getDataByLabel("Holders");
        const proTraders = getDataByLabel("Pro Traders");

        return {
            holders,
            proTraders
        };
    }

    function showNotification(message) {
        GM_notification({
            text: message,
            title: "QUANTUM ACCUMULATION DETECTOR PRO",
            image: "https://files.catbox.moe/ghio2p.mp3",
            timeout: 6000
        });
    }

    function showToast(price, score, isExplosion = false, isHyperspeed = false, isMega = false, customMessage = null) {
        const toast = document.createElement('div');
        const isNovaPulseAlert = customMessage !== null;
        toast.className = `ctm-toast ${isExplosion ? 'explosion' : ''} ${isHyperspeed ? 'hyperspeed' : ''} ${isMega ? 'mega' : ''} ${isNovaPulseAlert ? 'nova-pro-alert' : ''}`;

        // Determine icon color based on alert type
        let iconColor = '#00ff88';
        if (isExplosion) iconColor = '#ff4d4d';
        else if (isHyperspeed) iconColor = '#0062ff';
        else if (isMega) iconColor = '#ff8c00';
        else if (isNovaPulseAlert) iconColor = '#6a11cb';

        toast.innerHTML = `
            <div class="ctm-toast-header ${isExplosion ? 'explosion' : ''} ${isHyperspeed ? 'hyperspeed' : ''} ${isMega ? 'mega' : ''}">
                <div class="ctm-toast-icon">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="${iconColor}">
                        <path d="M12 2L15 8L21 9L17 14L18 20L12 17L6 20L7 14L3 9L9 8L12 2Z"/>
                    </svg>
                </div>
                <span>${isNovaPulseAlert ? 'Nova Pulse Alert 🔔' : (isMega ? 'MEGA ACCUMULATION DETECTED!' : (isHyperspeed ? 'MEGA EXPLOSION DETECTED!' : isExplosion ? 'EXPLOSION IMMINENT!' : 'ACCUMULATION DETECTED!'))}</span>
            </div>

            ${isNovaPulseAlert ? `
                <div class="ctm-toast-detail">
                    <span>${customMessage}</span>
                </div>
            ` : `
                <div class="ctm-toast-detail">
                    <span>🎯 Action:</span>
                    <span>${isExplosion || isHyperspeed || isMega ? 'ENTER IMMEDIATELY!' : 'PREPARE TO ENTER'}</span>
                </div>
                <div class="ctm-toast-detail">
                    <span>💵 Price:</span>
                    <span>$${price.toFixed(8)}</span>
                </div>
                <div class="ctm-toast-detail">
                    <span>🤖 AI Score:</span>
                    <span>${Math.round(score)}%</span>
                </div>
                <div class="ctm-toast-detail" style="color:#00ff88;">
                    <span>🥇 Success Rate: ${confirmedSignals > 0 ? ((successfulSignals/confirmedSignals)*100).toFixed(1) : '100'}%</span>
                </div>
            `}
        `;

        document.body.appendChild(toast);
        setTimeout(() => toast.classList.add('show'), 10);

        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, isNovaPulseAlert ? 5000 : (isMega ? 10000 : (isHyperspeed ? 8000 : isExplosion ? 10000 : 5000)));

        // Play sound notification
        let soundUrl;
        if (isNovaPulseAlert) {
            soundUrl = 'https://files.catbox.moe/bwx7f0.mp3';
        } else if (isMega) {
            soundUrl = 'https://files.catbox.moe/5k8n0d.mp3'; // Fire alarm sound
        } else if (isHyperspeed) {
            soundUrl = 'https://files.catbox.moe/ghio2p.mp3';
        } else if (isExplosion) {
            soundUrl = 'https://files.catbox.moe/od43jx.mp3';
        } else {
            soundUrl = 'https://files.catbox.moe/gs2pl3.mp3';
        }

        const sound = new Audio(soundUrl);
        sound.volume = isMega ? 0.8 : (isHyperspeed ? 0.6 : isExplosion ? 0.7 : 0.5);
        sound.play();
    }

    // Update whale tooltip data
    function updateWhaleTooltip() {
        document.getElementById('whale-tooltip-total-buy').textContent = `$${cleanDecimal(formatNumber(whaleData.whaleActivity.totalBuy))}`;
        document.getElementById('whale-tooltip-total-sell').textContent = `$${cleanDecimal(formatNumber(whaleData.whaleActivity.totalSell))}`;
        document.getElementById('whale-tooltip-net-flow').textContent =
            whaleData.whaleActivity.netFlow >= 0 ?
            `+$${cleanDecimal(formatNumber(whaleData.whaleActivity.netFlow))}` :
            `-$${cleanDecimal(formatNumber(Math.abs(whaleData.whaleActivity.netFlow)))}`;
        document.getElementById('whale-tooltip-total').textContent = whaleData.whaleActivity.totalProTraders;
        document.getElementById('whale-tooltip-holders').textContent = whaleData.whaleActivity.holders;
        document.getElementById('whale-tooltip-current').textContent =
            whaleData.megaAccumulationDetected ? 'MEGA ACCUMULATION' :
            whaleData.whaleActivity.isAccumulating ? 'ACCUMULATING' :
            whaleData.recentCluster ? 'CLUSTER FORMING' : 'NEUTRAL';

        // Calculate ML success rate
        const totalSignals = signalSuccessHistory.length;
        const successfulSignals = signalSuccessHistory.filter(s => s.success).length;
        const successRate = totalSignals > 0 ? (successfulSignals / totalSignals * 100).toFixed(1) : 'N/A';
        document.getElementById('whale-tooltip-ml').textContent = `${successRate}%`;
    }

    // Update timeframe convergence UI
    function updateTimeframeUI() {
        const timeframes = ['5s', '15s', '1m'];

        for (const timeframe of timeframes) {
            const element = document.getElementById(`tf-${timeframe}`);
            if (!element) continue;

            const data = timeframeData[timeframe];
            if (data.signals.length === 0) {
                element.textContent = '-';
                element.classList.remove('tf-active', 'bearish');
                continue;
            }

            const lastSignal = data.signals[data.signals.length - 1];
            element.textContent = lastSignal === 'bullish' ? '↑' : '↓';

            if (lastSignal === 'bullish') {
                element.classList.add('tf-active');
                element.classList.remove('bearish');
            } else {
                element.classList.add('bearish');
                element.classList.remove('tf-active');
            }
        }
    }

    // Multi-timeframe data collection
    function collectTimeframeData(price, volume) {
        const now = Date.now();

        // 5-second timeframe
        if (!timeframeData['5s'].lastUpdate || now - timeframeData['5s'].lastUpdate >= 5000) {
            timeframeData['5s'].prices.push(price);
            timeframeData['5s'].volumes.push(volume);
            timeframeData['5s'].lastUpdate = now;

            // Analyze signal for this timeframe
            const signal = analyzeTimeframeSignal('5s');
            timeframeData['5s'].signals.push(signal);

            // Maintain size
            if (timeframeData['5s'].prices.length > 20) {
                timeframeData['5s'].prices.shift();
                timeframeData['5s'].volumes.shift();
                timeframeData['5s'].signals.shift();
            }
        }

        // 15-second timeframe
        if (!timeframeData['15s'].lastUpdate || now - timeframeData['15s'].lastUpdate >= 15000) {
            timeframeData['15s'].prices.push(price);
            timeframeData['15s'].volumes.push(volume);
            timeframeData['15s'].lastUpdate = now;

            // Analyze signal for this timeframe
            const signal = analyzeTimeframeSignal('15s');
            timeframeData['15s'].signals.push(signal);

            // Maintain size
            if (timeframeData['15s'].prices.length > 15) {
                timeframeData['15s'].prices.shift();
                timeframeData['15s'].volumes.shift();
                timeframeData['15s'].signals.shift();
            }
        }

        // 1-minute timeframe
        if (!timeframeData['1m'].lastUpdate || now - timeframeData['1m'].lastUpdate >= 60000) {
            timeframeData['1m'].prices.push(price);
            timeframeData['1m'].volumes.push(volume);
            timeframeData['1m'].lastUpdate = now;

            // Analyze signal for this timeframe
            const signal = analyzeTimeframeSignal('1m');
            timeframeData['1m'].signals.push(signal);

            // Maintain size
            if (timeframeData['1m'].prices.length > 10) {
                timeframeData['1m'].prices.shift();
                timeframeData['1m'].volumes.shift();
                timeframeData['1m'].signals.shift();
            }
        }
    }

    // Analyze signal for a specific timeframe
    function analyzeTimeframeSignal(timeframe) {
        const data = timeframeData[timeframe];
        if (data.prices.length < 5) return 'neutral';

        // Calculate price trend
        const priceChange = data.prices[data.prices.length - 1] - data.prices[0];
        const isBullish = priceChange > 0;

        // Calculate volume trend
        const volumeAvg = data.volumes.reduce((a, b) => a + b, 0) / data.volumes.length;
        const lastVolume = data.volumes[data.volumes.length - 1];
        const volumeIncreasing = lastVolume > volumeAvg * 1.5;

        return isBullish && volumeIncreasing ? 'bullish' : 'bearish';
    }

    // Accumulation scan function with Shockwave Engine enhancements
    function accumulationScan() {
        if (!isCoinPage()) {
            container.style.display = 'none';
            return;
        }

        container.style.display = 'block';

        const price = getPrice();
        const volume = getVolume();

        if (!price || !volume) {
            // Skip if data not available
            return;
        }

        // Add to history with timestamp
        priceHistory.push({
            timestamp: Date.now(),
            value: price
        });
        volumeHistory.push(volume);

        // Maintain history size based on scalping mode
        if (config.scalpingMode) {
            const maxSize = config.maxHistorySize;
            if (priceHistory.length > maxSize) priceHistory.splice(0, priceHistory.length - maxSize);
            if (volumeHistory.length > maxSize) volumeHistory.splice(0, volumeHistory.length - maxSize);
        } else {
            if (priceHistory.length > 60) priceHistory.shift();
            if (volumeHistory.length > 60) volumeHistory.shift();
        }

        // Evaluate past signals for ML learning
        const now = Date.now();
        signalSuccessHistory = signalSuccessHistory.filter(signal => {
            if (signal.success === null && now - signal.time > config.mlEvaluationPeriod) {
                signal.success = mlModel.evaluateSignalSuccess(signal);
                if (signal.success !== null) {
                    mlModel.updateWeights(signal.success, signal.activeConditions);
                }
            }
            return now - signal.time < 86400000; // Keep only 24 hours of history
        });

        // Save updated history
        GM_setValue('quantumSignalSuccessHistory', signalSuccessHistory);

        // Calculate ML success rate
        const totalSignals = signalSuccessHistory.length;
        const successfulSignalsCount = signalSuccessHistory.filter(s => s.success).length;
        const mlSuccessRate = totalSignals > 0 ? (successfulSignalsCount / totalSignals * 100).toFixed(1) : 'N/A';
        document.getElementById('ctm-ml-success').textContent = `${mlSuccessRate}%`;

        // Get data
        const stats = extractInvestmentStats();
        const amountsData = extractInvestmentAmountsWithTimestamp();

        // Update whale data
        whaleData.whaleActivity.totalBuy = amountsData.totalBuy;
        whaleData.whaleActivity.totalSell = amountsData.totalSell;
        whaleData.whaleActivity.netFlow = amountsData.netFlow;
        whaleData.whaleActivity.last50Transactions = amountsData.last50Transactions;
        whaleData.whaleActivity.totalProTraders = stats.proTraders;
        whaleData.whaleActivity.holders = stats.holders;
        whaleData.whaleActivity.buyPressure = amountsData.totalBuy / (amountsData.totalBuy + amountsData.totalSell);
        whaleData.whaleActivity.sellPressure = amountsData.totalSell / (amountsData.totalBuy + amountsData.totalSell);

        // Track pro traders history
        proTradersHistory.push({ time: now, value: stats.proTraders });

        // Keep only last 15 seconds of data
        proTradersHistory = proTradersHistory.filter(entry => now - entry.time <= 15000);

        // Calculate change in pro traders
        let proTradersChange = 0;
        if (proTradersHistory.length > 1) {
            const oldest = proTradersHistory[0].value;
            proTradersChange = stats.proTraders - oldest;
        }

        // Update pro traders display with change indicator
        const proTradersEl = document.getElementById('ctm-pro-traders');
        if (proTradersChange > 0) {
            proTradersEl.innerHTML = `<span style="color:#00ff88;">${stats.proTraders} (+${proTradersChange}) ▲</span>`;
        } else if (proTradersChange < 0) {
            proTradersEl.innerHTML = `<span style="color:#ff4d4d;">${stats.proTraders} (${proTradersChange}) ▼</span>`;
        } else {
            proTradersEl.textContent = stats.proTraders;
        }

        // Accumulation detection
        whaleData.whaleActivity.accumulationRatio = amountsData.totalBuy / (amountsData.totalSell + 1);
        whaleData.whaleActivity.isAccumulating =
            whaleData.whaleActivity.accumulationRatio > config.accumulationRatioThreshold &&
            amountsData.totalBuy > config.minAccumulationBuy;

        // Calculate indicators
        const obv = quantumLearning.calcOBV(priceHistory.map(p => p.value), volumeHistory);
        const volumeAcceleration = quantumLearning.detectVolumeAcceleration(volumeHistory);
        quantumLearning.analyzePatterns(priceHistory.map(p => p.value), volumeHistory);
        quantumLearning.detectConsolidation(priceHistory.map(p => p.value));

        // Detect scalping patterns
        quantumLearning.detectScalpingPatterns(priceHistory.map(p => p.value), volumeHistory, amountsData.last50Transactions);

        // Check for whale clusters
        const clusterNow = Date.now();
        const lastBuys = amountsData.last50Transactions.filter(t => t.type === 'Buy');
        whaleData.recentCluster = lastBuys.filter(t => clusterNow - t.detectedTime < config.clusterTimeWindow).length >= config.minClusterSize;

        // Update UI
        const netFlowEl = document.getElementById('ctm-net-flow');
        const netFlowValue = whaleData.whaleActivity.netFlow;
        if (netFlowValue >= 0) {
        netFlowEl.innerHTML = `<span style="color:#00ff88;">+$${cleanDecimal(formatNumber(netFlowValue))} ▲</span>`;} else {
        netFlowEl.innerHTML = `<span style="color:#ff4d4d;">-$${cleanDecimal(formatNumber(Math.abs(netFlowValue)))} ▼</span>`;}
        netFlowEl.classList.toggle('negative', netFlowValue < 0);
        document.getElementById('ctm-holders').textContent = stats.holders;
        document.getElementById('ctm-volume').textContent = formatNumber(volume);
        document.getElementById('ctm-cluster').textContent = whaleData.recentCluster ? 'ACTIVE' : 'INACTIVE';

        const patternText =
            whaleData.patternRecognition.bullFlag ? 'BULL FLAG' :
            whaleData.patternRecognition.cupAndHandle ? 'CUP & HANDLE' :
            whaleData.patternRecognition.fallingWedge ? 'FALLING WEDGE' :
            whaleData.patternRecognition.ascendingTriangle ? 'ASC TRIANGLE' :
            whaleData.patternRecognition.doubleBottom ? 'DOUBLE BOTTOM' :
            whaleData.patternRecognition.inverseHeadShoulders ? 'INV H&S' :
            whaleData.patternRecognition.pennant ? 'PENNANT' :
            whaleData.patternRecognition.roundingBottom ? 'ROUNDING BOTTOM' :
            whaleData.patternRecognition.microRangeCompression ? 'MICRO RANGE' :
            whaleData.patternRecognition.vduSpike ? 'VDU SPIKE' :
            whaleData.patternRecognition.trapAndRun ? 'TRAP & RUN' : 'NONE';
        document.getElementById('ctm-pattern').textContent = patternText;

        // Shockwave Engine - Update explosion odds
        whaleData.shockwave.explosionOdds = quantumLearning.calculateExplosionOdds(
            priceHistory.map(p => p.value), volumeHistory, amountsData.last50Transactions
        );

        // Update Shockwave UI
        document.getElementById('shockwave-progress').style.width = `${whaleData.shockwave.explosionOdds}%`;
        document.getElementById('explosion-odds').textContent = `${whaleData.shockwave.explosionOdds.toFixed(0)}%`;

        // Update RSI and VWAP displays
        document.getElementById('ctm-rsi').textContent = whaleData.shockwave.rsiValue.toFixed(0);
        document.getElementById('ctm-vwap').textContent = whaleData.shockwave.vwapValue.toFixed(8);

        // Update timeframe convergence
        quantumLearning.checkTimeframeConvergence();
        updateTimeframeUI();

        // Update tooltip
        updateWhaleTooltip();

        // Accumulation conditions
        const conditionResults = {
            pro_trader_buy_volume: amountsData.totalBuy > config.proTraderMinAmount,
            net_whale_flow: whaleData.whaleActivity.netFlow > config.minWhaleNetFlow,
            obv_spike: obv > (volume * 1.8),
            whale_cluster: whaleData.recentCluster,
            accumulation_pattern: whaleData.whaleActivity.isAccumulating,
            volume_acceleration: volumeAcceleration > 0.25,
            consolidation: whaleData.consolidation.detected,
            pattern_match: patternText !== 'NONE',
            // Shockwave Engine conditions
            shockwave_engine: whaleData.shockwave.explosionOdds > 70,
            explosion_odds: whaleData.shockwave.explosionOdds > 80,
            candle_pattern: whaleData.patternRecognition.marubozu ||
                           whaleData.patternRecognition.bullishEngulfing,
            vwap_confirmation: whaleData.shockwave.vwapRetest && whaleData.shockwave.vwapBounce,
            timeframe_convergence: whaleData.shockwave.timeframeConvergence,
            // Scalping conditions
            scalping_mode: config.scalpingMode,
            instant_buy_pressure: whaleData.whaleActivity.buyPressure > config.instantBuyPressureThreshold,
            volume_spike: volume > (volumeHistory.slice(-5).reduce((a, b) => a + b, 0) / 5 * config.minInstantVolumeRatio),
            micro_range: whaleData.patternRecognition.microRangeCompression,
            vdu_spike: whaleData.patternRecognition.vduSpike,
            flash_absorption: whaleData.patternRecognition.flashSpikeAbsorption,
            trap_run: whaleData.patternRecognition.trapAndRun,
            shakeout_bar: whaleData.patternRecognition.shakeoutBar,
            supply_absorption: whaleData.patternRecognition.supplyAbsorption,
            volume_staircase: whaleData.patternRecognition.volumeStaircase,
            darvas_box: whaleData.patternRecognition.darvasBox,
            box_breakout: whaleData.patternRecognition.boxBreakoutRetest,
            hidden_divergence: whaleData.patternRecognition.hiddenBullishDivergence,
            obv_uptrend: whaleData.patternRecognition.obvUptrend,
            buy_wall_stack: whaleData.patternRecognition.buyWallStack,
            vwap_retest: whaleData.patternRecognition.vwapRetestSuccess
        };

        let score = 0;

        // Apply ML weights to scoring
        Object.keys(conditionResults).forEach(cond => {
            const weight = mlModel.conditionWeights[cond] || 1.0;
            if (conditionResults[cond]) {
                // Add badge to condition if weight is high
                if (weight > 1.2) {
                    const condEl = document.getElementById(`ctm-cond-${cond}`);
                    if (condEl && !condEl.querySelector('.ml-badge')) {
                        const badge = document.createElement('div');
                        badge.className = 'ml-badge';
                        badge.textContent = 'ML+';
                        condEl.appendChild(badge);
                    }
                }

                // Base score values based on condition importance
                let baseScore = 0;
                switch(cond) {
                    case 'accumulation_pattern': baseScore = 25; break;
                    case 'net_whale_flow': baseScore = 20; break;
                    case 'whale_cluster': baseScore = 15; break;
                    case 'pattern_match': baseScore = 15; break;
                    case 'pro_trader_buy_volume': baseScore = 15; break;
                    case 'explosion_odds': baseScore = 12; break;
                    case 'volume_acceleration': baseScore = 10; break;
                    case 'shockwave_engine': baseScore = 10; break;
                    case 'vwap_confirmation': baseScore = 10; break;
                    case 'timeframe_convergence': baseScore = 10; break;
                    case 'obv_spike': baseScore = 10; break;
                    case 'consolidation': baseScore = 8; break;
                    case 'candle_pattern': baseScore = 8; break;
                    default: baseScore = 5; break;
                }

                score += baseScore * weight;
            }
        });

        // Apply false signal filter
        const isFalseSignal = quantumLearning.isFalseSignal(priceHistory.map(p => p.value), volumeHistory);
        if (isFalseSignal) {
            score *= 0.7; // Reduce score for potential false signal
            falseSignalHistory.push({ time: Date.now() });

            // Maintain false signal history size
            if (falseSignalHistory.length > config.maxFalseSignalHistory) {
                falseSignalHistory.shift();
            }
        }

        // Cap score at 100%
        score = Math.min(100, Math.max(0, score));

        // Update UI
        document.getElementById('ctm-score-value').textContent = `${Math.round(score)}%`;
        document.getElementById('ctm-progress-bar').style.width = `${score}%`;

        // Update strength indicators
        const lowDot = document.querySelector('.ctm-strength-low');
        const mediumDot = document.querySelector('.ctm-strength-medium');
        const highDot = document.querySelector('.ctm-strength-high');
        const strengthBadge = document.getElementById('ctm-strength-badge');

        // Remove active class from all
        lowDot.classList.remove('active');
        mediumDot.classList.remove('active');
        highDot.classList.remove('active');

        if (score <= 30) {
            lowDot.classList.add('active');
            strengthBadge.classList.remove('show');
        } else if (score <= 60) {
            mediumDot.classList.add('active');
            strengthBadge.classList.remove('show');
        } else {
            highDot.classList.add('active');
            strengthBadge.innerHTML = `<span>🔥 ${Math.round(score)}%</span>`;
            strengthBadge.classList.add('show');
        }

        // Update condition indicators
        conditions.forEach(cond => {
            const el = document.getElementById(`ctm-cond-${cond.id}`);
            if (el) {
                const isActive = conditionResults[cond.id];
                el.classList.toggle('active', isActive);

                if (isActive) {
                    if (cond.id === 'explosion') {
                        el.classList.add('explosion');
                    } else if (cond.id === 'hyperspeed') {
                        el.classList.add('hyperspeed');
                    } else if (cond.id === 'mega_accumulation') {
                        el.classList.add('mega');
                    } else {
                        el.classList.remove('explosion', 'hyperspeed', 'mega');
                    }
                } else {
                    el.classList.remove('explosion', 'hyperspeed', 'mega');
                }
            }
        });

        // Update performance badges
        updateConditionPerformanceUI();

        const statusEl = document.getElementById('ctm-status');
        const explosionProgressEl = document.getElementById('ctm-explosion-progress');
        const hyperspeedProgressEl = document.getElementById('ctm-hyperspeed-progress');
        const megaProgressEl = document.getElementById('ctm-mega-progress');

        // ==== INSTANT EXPLOSION DETECTION ==== //
        const pricesOnly = priceHistory.map(p => p.value);
        const instantExplosion = mlModel.predictInstantExplosion(pricesOnly);

        if (instantExplosion.predicted && !explosionDetected && !hyperspeedDetected) {
            const predictionTime = now + config.instantExplosionPredictionSeconds * 1000;

            // Record signal for ML evaluation
            signalSuccessHistory.push({
                time: now,
                price: price,
                type: 'instant_explosion',
                success: null,
                confidence: instantExplosion.confidence,
                activeConditions: conditionResults,
                predictionTime: predictionTime
            });
            GM_setValue('quantumSignalSuccessHistory', signalSuccessHistory);

            // Show prediction alert
            statusEl.textContent = `INSTANT EXPLOSION PREDICTED IN ${config.instantExplosionPredictionSeconds}S! (${(instantExplosion.confidence * 100).toFixed(1)}%)`;
            statusEl.classList.add('hyperspeed');
            showToast(price, instantExplosion.confidence * 100, false, true);

            // Reset ML badges
            document.querySelectorAll('.ml-badge').forEach(badge => badge.remove());
        }

        // ==== MEGA ACCUMULATION DETECTION ==== //
        const megaConditions = [
            score >= config.megaAccumulationThreshold,
            whaleData.whaleActivity.totalProTraders >= config.megaProTradersThreshold,
            whaleData.whaleActivity.totalBuy >= config.megaBuyVolumeThreshold,
            whaleData.consolidation.detected && whaleData.consolidation.duration >= 3,
            whaleData.whaleActivity.volatilityIndex < config.megaVolatilityThreshold,
            conditionResults.pattern_match,
            volume > (volumeHistory.slice(-10).reduce((a, b) => a + b, 0) / 10 * config.megaVolumeRatio)
        ];

        const megaScore = megaConditions.reduce((total, condition) => total + (condition ? 1 : 0), 0);
        const megaConfidence = megaScore / megaConditions.length;

        // Check if mega accumulation is detected
        if (megaConfidence >= config.megaPatternWeight &&
            Date.now() - lastMegaAccumulationTime > config.megaAccumulationCooldown) {

            whaleData.megaAccumulationDetected = true;
            megaAccumulationDetected = true;
            megaAccumulationStartTime = Date.now();
            lastMegaAccumulationTime = now;

            // Add special indicator
            if (!document.querySelector('.ctm-mega-indicator')) {
                const megaIndicator = document.createElement('div');
                megaIndicator.className = 'ctm-mega-indicator';
                megaIndicator.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="#fff"><path d="M12 2L15 8L21 9L17 14L18 20L12 17L6 20L7 14L3 9L9 8L12 2Z"/></svg>';
                statusEl.appendChild(megaIndicator);
            }

            // Add mega mode badge to container
            if (!document.querySelector('.ctm-mega-mode')) {
                const megaModeBadge = document.createElement('div');
                megaModeBadge.className = 'ctm-mega-mode';
                megaModeBadge.textContent = 'MEGA ACCUMULATION';
                container.appendChild(megaModeBadge);
            }

            statusEl.textContent = 'MEGA ACCUMULATION DETECTED! IMMINENT EXPLOSION! 🔥🔥';
            statusEl.classList.add('mega-accumulation');
            showToast(price, score, false, false, true);

            // Record signal for ML
            signalSuccessHistory.push({
                time: now,
                price: price,
                type: 'mega_accumulation',
                success: null,
                confidence: megaConfidence,
                activeConditions: conditionResults
            });
            GM_setValue('quantumSignalSuccessHistory', signalSuccessHistory);

            successfulSignals++;
            quantumLearning.adjustWeights(true);
            inTrade = true;
            tradeStartTime = now;
            accumulationActive = true;
            accumulationEndAlertActive = false;
        }

        // Handle mega accumulation progress
        if (megaAccumulationDetected) {
            const timeSinceMega = now - megaAccumulationStartTime;
            megaProgressEl.style.width = `${100 - (timeSinceMega / 100)}%`;

            if (timeSinceMega > config.minStrengthDuration * 1.5) {
                megaAccumulationDetected = false;
                whaleData.megaAccumulationDetected = false;
                megaProgressEl.style.width = '0%';
                statusEl.classList.remove('mega-accumulation');

                // Remove indicators
                document.querySelector('.ctm-mega-indicator')?.remove();
                document.querySelector('.ctm-mega-mode')?.remove();
            }
        }

        // Check for explosion conditions
        if (pricesOnly.length >= 4) {
            const currentPrice = pricesOnly[pricesOnly.length - 1];
            const prevPrice = pricesOnly[pricesOnly.length - 2];
            const prevPrevPrice = pricesOnly[pricesOnly.length - 3];
            const prevPrevPrevPrice = pricesOnly[pricesOnly.length - 4];

            const priceChange1 = (currentPrice - prevPrice) / prevPrice;
            const priceChange2 = (prevPrice - prevPrevPrice) / prevPrevPrice;
            const priceChange3 = (prevPrevPrice - prevPrevPrevPrice) / prevPrevPrevPrice;
            const priceAcceleration = (priceChange1 + priceChange2 * 0.7 + priceChange3 * 0.5) / 2.2;

            // Hyperspeed explosion (rapid move)
            if (priceChange1 > config.hyperspeedThreshold && priceAcceleration > 0.1 && volume > getVolume() * 3.2) {
                hyperspeedStrength = 100;
                hyperspeedDetected = true;
                hyperspeedStartTime = now;
                statusEl.textContent = 'MEGA EXPLOSION DETECTED! ENTER IMMEDIATELY! ⚡⚡';
                statusEl.classList.add('hyperspeed');
                showToast(price, score, false, true);

                // Record signal for ML
                signalSuccessHistory.push({
                    time: now,
                    price: price,
                    type: 'hyperspeed_explosion',
                    success: null,
                    confidence: priceAcceleration,
                    activeConditions: conditionResults
                });
                GM_setValue('quantumSignalSuccessHistory', signalSuccessHistory);

                successfulSignals++;
                quantumLearning.adjustWeights(true);
                inTrade = true;
                tradeStartTime = now;
                accumulationActive = true;
                accumulationEndAlertActive = false; // Reset end alert
            }

            // Standard explosion
            if (priceChange1 > config.explosionThreshold && priceAcceleration > 0.05 && !hyperspeedDetected) {
                explosionDetected = true;
                explosionStartTime = now;
                statusEl.textContent = 'EXPLOSION IMMINENT! PREPARE TO ENTER! 🔥';
                statusEl.classList.add('explosion');
                showToast(price, score, true);

                // Record signal for ML
                signalSuccessHistory.push({
                    time: now,
                    price: price,
                    type: 'explosion',
                    success: null,
                    confidence: priceAcceleration,
                    activeConditions: conditionResults
                });
                GM_setValue('quantumSignalSuccessHistory', signalSuccessHistory);

                successfulSignals++;
                quantumLearning.adjustWeights(true);
                inTrade = true;
                tradeStartTime = now;
                accumulationActive = true;
                accumulationEndAlertActive = false; // Reset end alert
            }
        }

        // Handle explosion strength decay
        if (explosionDetected) {
            const timeSinceExplosion = now - explosionStartTime;
            explosionProgressEl.style.width = `${100 - (timeSinceExplosion / 100)}%`;

            if (timeSinceExplosion > config.minStrengthDuration) {
                explosionDetected = false;
                explosionProgressEl.style.width = '0%';
                statusEl.classList.remove('explosion');
            }
        }

        // Handle hyperspeed strength decay
        if (hyperspeedDetected) {
            const timeSinceHyperspeed = now - hyperspeedStartTime;
            hyperspeedProgressEl.style.width = `${100 - (timeSinceHyperspeed / 50)}%`;

            if (timeSinceHyperspeed > config.minStrengthDuration) {
                hyperspeedDetected = false;
                hyperspeedProgressEl.style.width = '0%';
                statusEl.classList.remove('hyperspeed');
            }
        }

        // Nova Pulse Alert - accumulation status
        if (config.NovaPulseAlert && inTrade) {
            // Reassurance messages during accumulation
            if (accumulationActive && now - lastReassuranceTime > config.reassuranceInterval) {
                const messages = [
                      "<div style='text-align:center;'>Accumulation still strong!</div><div style='text-align:center;'>HOLD position. 💎</div>",
                      "<div style='text-align:center;'>Smart money still accumulating!</div><div style='text-align:center;'>Be patient. 🚀</div>",
                      "<div style='text-align:center;'>Whale activity confirms accumulation!</div><div style='text-align:center;'>Stay in trade. 🐋</div>",
                      "<div style='text-align:center;'>Patterns indicate continuation!</div><div style='text-align:center;'>Don't sell too early. 📈</div>",
                      "<div style='text-align:center;'>Momentum rising steadily!</div><div style='text-align:center;'>Confidence is key. 🔥</div>"
            ];

                const randomMessage = messages[Math.floor(Math.random() * messages.length)];
                showToast(price, score, false, false, false, randomMessage);
                lastReassuranceTime = now;
            }

            // Accumulation resumption detection
            if (score > 75 && !accumulationActive) {
                // Accumulation has resumed
                accumulationActive = true;
                accumulationEndAlertActive = false;
                showToast(price, score, false, false, false, "Accumulation resumed! HOLD position. 🔥");
                lastReassuranceTime = now;
            }
            // Accumulation end detection
            else if (score < 60 && accumulationActive) {
                // Check for dump/panic selling conditions
                const dumpConditions = [
                    whaleData.whaleActivity.sellPressure > config.dumpConfirmationThreshold,
                    volume > (volumeHistory.slice(-5).reduce((a, b) => a + b, 0) / 5) * config.panicSellVolumeMultiplier,
                    whaleData.patternRecognition.supplyAbsorption === false
                ];

                const dumpConfirmed = dumpConditions.filter(c => c).length >= 2;

                if (dumpConfirmed) {
                    accumulationEndCounter++;
                    if (accumulationEndCounter >= config.accumulationEndConfirmation) {
                        accumulationActive = false;
                        accumulationEndCounter = 0;
                        accumulationEndAlertActive = true;
                        accumulationEndAlertCount = 0;
                        accumulationEndLastAlertTime = now;
                        showToast(price, score, false, false, false, "Accumulation ended! Exit position. ⚠️");
                    }
                } else {
                    accumulationEndCounter = Math.max(0, accumulationEndCounter - 1);
                }
            } else {
                accumulationEndCounter = 0;
            }

            // Accumulation end alert repetition
            if (accumulationEndAlertActive && now - accumulationEndLastAlertTime > config.reassuranceInterval) {
                accumulationEndAlertCount++;
                accumulationEndLastAlertTime = now;
                const messages = [
                      "<div style='text-align:center;'>Accumulation has ended!</div><div style='text-align:center;'>Consider exiting. ⚠️</div>",
                      "<div style='text-align:center;'>Dump confirmed!</div><div style='text-align:center;'>Protect your profits. 🛑</div>",
                      "<div style='text-align:center;'>Panic selling detected!</div><div style='text-align:center;'>Exit position. 🔻</div>",
                      "<div style='text-align:center;'>Whales are selling!</div><div style='text-align:center;'>Time to exit. 🐋⬇️</div>"
                ];
                const randomMessage = messages[Math.floor(Math.random() * messages.length)];
                showToast(price, score, false, false, false, randomMessage);

                if (accumulationEndAlertCount >= 5) {
                    accumulationEndAlertActive = false;
                }
            }

            // Auto-exit after 30 minutes
            if (now - tradeStartTime > 30 * 60 * 1000) {
                inTrade = false;
                accumulationActive = false;
                accumulationEndAlertActive = false;
                showToast(price, score, false, false, false, "Trade duration expired. Consider exiting position.");
            }
        }

        // Scalping-specific signals
        if (config.scalpingMode) {
            // Instant buy pressure signal
            if (conditionResults.instant_buy_pressure &&
                conditionResults.volume_spike &&
                now - lastSignalTime > 2000) {

                statusEl.textContent = 'SCALPING SIGNAL: STRONG BUY PRESSURE!';
                statusEl.classList.add('alert');
                showToast(price, score, false, false, false, "Scalping: Strong buy pressure detected! ⚡");
                lastSignalTime = now;
            }

            // Micro range breakout signal
            if (whaleData.patternRecognition.microRangeCompression &&
                price > Math.max(...pricesOnly.slice(-5)) &&
                volume > volumeHistory.slice(-5).reduce((a, b) => a + b, 0) / 5 * 2.5) {

                statusEl.textContent = 'SCALPING SIGNAL: MICRO RANGE BREAKOUT!';
                statusEl.classList.add('alert');
                showToast(price, score, false, false, false, "Scalping: Micro range breakout detected! 🚀");
                lastSignalTime = now;
            }
        }

        // Accumulation detection
        if (score >= config.minAccumulationScore &&
            now - lastSignalTime > config.cooldownPeriod &&
            !explosionDetected &&
            !hyperspeedDetected &&
            !megaAccumulationDetected) {

            confirmedSignals++;
            lastSignalTime = now;
            breakoutPrice = price;

            statusEl.textContent = 'STRONG ACCUMULATION DETECTED! PREPARE FOR EXPLOSION!';
            statusEl.classList.add('alert');
            showToast(price, score);

            // Record signal for ML
            signalSuccessHistory.push({
                time: now,
                price: price,
                type: 'accumulation',
                success: null,
                confidence: score,
                activeConditions: conditionResults
            });
            GM_setValue('quantumSignalSuccessHistory', signalSuccessHistory);

            // Reset status after delay
            setTimeout(() => {
                statusEl.classList.remove('alert');
            }, 5000);
        } else if (!explosionDetected && !hyperspeedDetected && !megaAccumulationDetected) {
            if (score >= config.minAccumulationScore - 15) {
                statusEl.textContent = 'Early accumulation detected...';
                statusEl.classList.add('alert');
            } else {
                statusEl.textContent = 'Scanning for accumulation patterns...';
                statusEl.classList.remove('alert');
            }
            statusEl.classList.remove('explosion');
            statusEl.classList.remove('hyperspeed');
            statusEl.classList.remove('mega-accumulation');
        }

        // Collect multi-timeframe data
        collectTimeframeData(price, volume);
    }

    // Start scanning immediately
    checkPageAndInitialize();

    // Dynamic scan interval based on mode
    function getScanInterval() {
        return config.scalpingMode ?
            config.scalpingTimeframe * 1000 :
            config.scanInterval;
    }

    const scanInterval = setInterval(() => {
        accumulationScan();
    }, getScanInterval());

    let lastUrl = location.href;

    const pageChangeCheckInterval = setInterval(() => {
        const currentUrl = location.href;
        if (currentUrl !== lastUrl) {
            lastUrl = currentUrl;
            checkPageAndInitialize();
        }
    }, 1000);

    window.addEventListener('beforeunload', () => {
        clearInterval(scanInterval);
        clearInterval(pageChangeCheckInterval);
    });

    function checkPageAndInitialize() {
        if (isCoinPage()) {
            container.style.display = 'block';
            // Run initial scan immediately
            setTimeout(accumulationScan, 100);
        } else {
            container.style.display = 'none';
        }
    }

    // Generate settings fields when script loads
    generateSettingsFields();
})();
