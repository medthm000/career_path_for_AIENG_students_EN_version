"use client";

import React, { useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, Cell } from 'recharts';

const TimeSeriesAnalysis = () => {
  const [activeTab, setActiveTab] = useState('original');
  const [showTable, setShowTable] = useState(false);

  // Données originales
  const originalData = [
    { t: 1, year: 2018, quarter: 'T1', sales: 5030 },
    { t: 2, year: 2018, quarter: 'T2', sales: 6030 },
    { t: 3, year: 2018, quarter: 'T3', sales: 7030 },
    { t: 4, year: 2018, quarter: 'T4', sales: 5780 },
    { t: 5, year: 2019, quarter: 'T1', sales: 5280 },
    { t: 6, year: 2019, quarter: 'T2', sales: 6780 },
    { t: 7, year: 2019, quarter: 'T3', sales: 7530 },
    { t: 8, year: 2019, quarter: 'T4', sales: 6530 },
    { t: 9, year: 2020, quarter: 'T1', sales: 5530 },
    { t: 10, year: 2020, quarter: 'T2', sales: 7280 },
    { t: 11, year: 2020, quarter: 'T3', sales: 8530 },
    { t: 12, year: 2020, quarter: 'T4', sales: 7030 },
    { t: 13, year: 2021, quarter: 'T1', sales: 6280 },
    { t: 14, year: 2021, quarter: 'T2', sales: 8280 },
    { t: 15, year: 2021, quarter: 'T3', sales: 9280 },
    { t: 16, year: 2021, quarter: 'T4', sales: 7780 },
  ];

  // ==========================================
  // DYNAMIC CALCULATIONS - LEAST SQUARES METHOD
  // ==========================================
  
  // Calculate trend coefficients dynamically using least squares
  const calculateLeastSquaresTrend = () => {
    const n = originalData.length;
    const sumT = originalData.reduce((sum, d) => sum + d.t, 0);
    const sumY = originalData.reduce((sum, d) => sum + d.sales, 0);
    const sumT2 = originalData.reduce((sum, d) => sum + d.t * d.t, 0);
    const sumTY = originalData.reduce((sum, d) => sum + d.t * d.sales, 0);
    
    // Formulas: a = (n*ΣtY - Σt*ΣY) / (n*Σt² - (Σt)²)
    //           b = (ΣY - a*Σt) / n
    const a = (n * sumTY - sumT * sumY) / (n * sumT2 - sumT * sumT);
    const b = (sumY - a * sumT) / n;
    
    return { a, b, sumT, sumY, sumT2, sumTY };
  };

  const { a: trendA, b: trendB } = calculateLeastSquaresTrend();

  // Calculate trend for any time t
  const getTrend = (t: number) => trendB + trendA * t;

  // Calcul des tendances
  const calculateTrends = () => {
    return originalData.map(d => {
      // Méthode des moindres carrés (dynamically calculated)
      const trendMC = getTrend(d.t);
      
      // Méthode semi-moyenne (simplified - using only MC for rigor)
      const trendSM = getTrend(d.t);
      
      return {
        ...d,
        label: `${d.year}-${d.quarter}`,
        trendMC: Math.round(trendMC * 100) / 100,
        trendSM: Math.round(trendSM * 100) / 100,
      };
    });
  };

  // Calcul de la moyenne mobile
  const calculateMovingAverage = () => {
    const data = [...originalData];
    const result = [];
    
    // Calculate simple 4-period moving average first (MM4)
    for (let i = 0; i < data.length; i++) {
      if (i >= 1 && i < data.length - 2) {
        const sum = data[i-1].sales + data[i].sales + data[i+1].sales + data[i+2].sales;
        const mm4 = sum / 4;
        result.push({
          ...data[i],
          label: `${data[i].year}-${data[i].quarter}`,
          sales: data[i].sales,
          mm4: Math.round(mm4 * 100) / 100,
          mmc4: null as number | null
        });
      } else {
        result.push({
          ...data[i],
          label: `${data[i].year}-${data[i].quarter}`,
          sales: data[i].sales,
          mm4: null as number | null,
          mmc4: null as number | null
        });
      }
    }
    
    // Calculate centered moving average (MMc4) - average of two consecutive MM4 values
    for (let i = 0; i < result.length; i++) {
      if (i > 0 && i < result.length - 1 && result[i].mm4 !== null && result[i+1].mm4 !== null) {
        const mmc4 = (result[i].mm4! + result[i+1].mm4!) / 2;
        result[i].mmc4 = Math.round(mmc4 * 100) / 100;
      }
    }
    
    return result;
  };

  // ==========================================
  // SEASONAL COEFFICIENTS - RATIO-TO-MOVING-AVERAGE METHOD
  // ==========================================
  
  const calculateSeasonalCoefficients = () => {
    const movingAvgData = calculateMovingAverage();
    
    // Step 1: Calculate Yt/MMc4 for each observation where MMc4 is available
    const ratios: { [key: string]: number[] } = { 'T1': [], 'T2': [], 'T3': [], 'T4': [] };
    
    movingAvgData.forEach(d => {
      if (d.mmc4 !== null && d.mmc4 > 0) {
        const ratio = d.sales / d.mmc4;
        ratios[d.quarter].push(ratio);
      }
    });
    
    // Step 2: Calculate average ratio for each quarter (seasonal indices)
    const seasonalIndices: { [key: string]: number } = {};
    let productOfIndices = 1;
    
    Object.keys(ratios).forEach(quarter => {
      if (ratios[quarter].length > 0) {
        const avgRatio = ratios[quarter].reduce((sum, r) => sum + r, 0) / ratios[quarter].length;
        seasonalIndices[quarter] = avgRatio;
        productOfIndices *= avgRatio;
      }
    });
    
    // Step 3: Adjust so that the product of seasonal indices equals 1
    // Correction factor = (1 / product)^(1/4) for multiplicative model
    const correctionFactor = Math.pow(1 / productOfIndices, 1 / 4);
    
    Object.keys(seasonalIndices).forEach(quarter => {
      seasonalIndices[quarter] *= correctionFactor;
    });
    
    // Verify: product should now be 1
    const finalProduct = Object.values(seasonalIndices).reduce((prod, val) => prod * val, 1);
    
    return {
      indices: seasonalIndices,
      ratios: ratios,
      correctionFactor: correctionFactor,
      finalProduct: finalProduct
    };
  };

  const seasonalData = calculateSeasonalCoefficients();
  const seasonalIndices = seasonalData.indices;

  // Coefficients saisonniers (for display)
  const seasonalCoefficients = [
    { quarter: 'T1', coefficient: seasonalIndices['T1'] || 1, color: '#ef4444' },
    { quarter: 'T2', coefficient: seasonalIndices['T2'] || 1, color: '#10b981' },
    { quarter: 'T3', coefficient: seasonalIndices['T3'] || 1, color: '#3b82f6' },
    { quarter: 'T4', coefficient: seasonalIndices['T4'] || 1, color: '#f59e0b' },
  ];

  // ==========================================
  // MULTIPLICATIVE MODEL: Yt = Tt × St × εt
  // ==========================================
  
  // Calcul de la série estimée (MULTIPLICATIVE MODEL)
  const calculateEstimatedSeries = () => {
    return originalData.map(d => {
      const trend = getTrend(d.t);
      const seasonal = seasonalIndices[d.quarter] || 1;
      const estimated = trend * seasonal; // MULTIPLICATIVE: Ŷt = Tt × St
      const residualRatio = d.sales / estimated; // Residual as ratio: εt = Yt / Ŷt
      
      return {
        ...d,
        label: `${d.year}-${d.quarter}`,
        trend: Math.round(trend * 100) / 100,
        estimated: Math.round(estimated * 100) / 100,
        residual: Math.round((residualRatio - 1) * 100 * 100) / 100, // Convert to percentage deviation
        residualRatio: Math.round(residualRatio * 10000) / 10000,
      };
    });
  };

  // Série corrigée des variations saisonnières (CVS) - MULTIPLICATIVE
  const calculateCVS = () => {
    return originalData.map(d => {
      const seasonal = seasonalIndices[d.quarter] || 1;
      const cvs = d.sales / seasonal; // MULTIPLICATIVE: CVSt = Yt / St
      
      return {
        ...d,
        label: `${d.year}-${d.quarter}`,
        cvs: Math.round(cvs * 100) / 100,
      };
    });
  };

  // ==========================================
  // ACCURACY METRICS
  // ==========================================
  
  const calculateAccuracyMetrics = () => {
    const estimatedData = calculateEstimatedSeries();
    
    let sumAbsoluteError = 0;
    let sumSquaredError = 0;
    let n = 0;
    
    estimatedData.forEach(d => {
      const error = d.sales - d.estimated;
      sumAbsoluteError += Math.abs(error);
      sumSquaredError += error * error;
      n++;
    });
    
    const mae = sumAbsoluteError / n; // Mean Absolute Error
    const mse = sumSquaredError / n;  // Mean Squared Error
    const rmse = Math.sqrt(mse);      // Root Mean Squared Error
    
    return {
      mae: Math.round(mae * 100) / 100,
      mse: Math.round(mse * 100) / 100,
      rmse: Math.round(rmse * 100) / 100,
    };
  };

  const accuracyMetrics = calculateAccuracyMetrics();

  // Prévisions 2022 (MULTIPLICATIVE MODEL)
  const forecasts2022 = [17, 18, 19, 20].map(t => {
    const year = 2022;
    const quarter = `T${((t - 1) % 4) + 1}` as 'T1' | 'T2' | 'T3' | 'T4';
    const trend = getTrend(t);
    const seasonal = seasonalIndices[quarter] || 1;
    const forecast = trend * seasonal; // MULTIPLICATIVE: Ŷt = Tt × St
    
    return {
      t,
      year,
      quarter,
      forecast: Math.round(forecast * 100) / 100,
    };
  });

  // Calcul complet du tableau (MULTIPLICATIVE MODEL)
  const calculateCompleteTable = () => {
    return originalData.map(d => {
      const trend = getTrend(d.t);
      const seasonal = seasonalIndices[d.quarter] || 1;
      const estimated = trend * seasonal; // MULTIPLICATIVE: Ŷt = Tt × St
      const residualRatio = d.sales / estimated; // εt = Yt / Ŷt
      const cvs = d.sales / seasonal; // CVSt = Yt / St
      const ytDivTrend = d.sales / trend; // Yt / Tt (ratio to trend)
      
      return {
        t: d.t,
        year: d.year,
        quarter: d.quarter,
        sales: d.sales,
        trend: Math.round(trend * 100) / 100,
        ytDivTrend: Math.round(ytDivTrend * 10000) / 10000,
        seasonal: Math.round(seasonal * 10000) / 10000,
        estimated: Math.round(estimated * 100) / 100,
        residual: Math.round((residualRatio - 1) * 100 * 100) / 100, // % deviation
        residualRatio: Math.round(residualRatio * 10000) / 10000,
        cvs: Math.round(cvs * 100) / 100,
      };
    });
  };

  const completeTable = calculateCompleteTable();
  const trendData = calculateTrends();
  const movingAvgData = calculateMovingAverage();
  const estimatedData = calculateEstimatedSeries();
  const cvsData = calculateCVS();
  const forecastData = [...estimatedData, ...forecasts2022.map(f => ({
    ...f,
    label: `${f.year}-${f.quarter}`,
    estimated: f.forecast,
    sales: undefined,
    trend: undefined,
    residual: undefined,
  }))];

  return (
    <div className="w-full max-w-7xl mx-auto p-6 bg-gradient-to-br from-blue-50 to-indigo-50 min-h-screen">
      <h1 className="text-3xl font-bold text-center mb-8 text-indigo-900">
        Time Series Analysis - Quarterly Sales (Multiplicative Model)
      </h1>

      {/* Button to show/hide calculation table */}
      <div className="mb-4 text-center">
        <button
          onClick={() => setShowTable(!showTable)}
          className="px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold rounded-lg shadow-lg hover:from-purple-700 hover:to-indigo-700 transition-all"
        >
          {showTable ? '🔼 Hide Calculation Table' : '🔽 Show Complete Calculation Table'}
        </button>
      </div>

      {/* Calculation table */}
      {showTable && (
        <div className="mb-6 bg-white rounded-lg shadow-lg p-6 overflow-x-auto">
          <h2 className="text-2xl font-bold mb-4 text-indigo-800 text-center">Calculation Summary Table - Multiplicative Model</h2>
          
          <div className="overflow-x-auto">
            <table className="min-w-full border-collapse border border-indigo-300">
              <thead>
                <tr className="bg-indigo-600 text-white">
                  <th className="border border-indigo-300 px-3 py-2">t</th>
                  <th className="border border-indigo-300 px-3 py-2">Year</th>
                  <th className="border border-indigo-300 px-3 py-2">Quarter</th>
                  <th className="border border-indigo-300 px-3 py-2">Sales (Yt)</th>
                  <th className="border border-indigo-300 px-3 py-2">Trend (Tt)</th>
                  <th className="border border-indigo-300 px-3 py-2">Yt / Tt</th>
                  <th className="border border-indigo-300 px-3 py-2">Seasonal Index (St)</th>
                  <th className="border border-indigo-300 px-3 py-2">Estimated (Ŷt = Tt×St)</th>
                  <th className="border border-indigo-300 px-3 py-2">Residual Ratio (εt)</th>
                  <th className="border border-indigo-300 px-3 py-2">CVS (Yt/St)</th>
                </tr>
              </thead>
              <tbody>
                {completeTable.map((row, index) => (
                  <tr key={index} className={index % 2 === 0 ? 'bg-indigo-50' : 'bg-white'}>
                    <td className="border border-indigo-300 px-3 py-2 text-center font-semibold">{row.t}</td>
                    <td className="border border-indigo-300 px-3 py-2 text-center">{row.year}</td>
                    <td className="border border-indigo-300 px-3 py-2 text-center font-semibold">{row.quarter}</td>
                    <td className="border border-indigo-300 px-3 py-2 text-center font-bold text-purple-700">{row.sales}</td>
                    <td className="border border-indigo-300 px-3 py-2 text-center">{row.trend}</td>
                    <td className="border border-indigo-300 px-3 py-2 text-center">{row.ytDivTrend}</td>
                    <td className="border border-indigo-300 px-3 py-2 text-center font-semibold" style={{
                      color: row.seasonal > 1 ? '#10b981' : '#ef4444'
                    }}>
                      {row.seasonal}
                    </td>
                    <td className="border border-indigo-300 px-3 py-2 text-center font-bold text-green-700">{row.estimated}</td>
                    <td className="border border-indigo-300 px-3 py-2 text-center">{row.residualRatio}</td>
                    <td className="border border-indigo-300 px-3 py-2 text-center">{row.cvs}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Seasonal coefficients calculation details */}
          <div className="mt-6 bg-indigo-50 p-4 rounded-lg">
            <h3 className="font-bold text-lg mb-3 text-indigo-800">Seasonal Indices - Ratio-to-Moving-Average Method</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
              {Object.entries(seasonalIndices).map(([quarter, index]) => (
                <div key={quarter} className="bg-white p-3 rounded-lg border-2 border-indigo-200">
                  <div className="font-bold text-center text-lg mb-2">{quarter}</div>
                  <div className="text-sm">Seasonal Index:</div>
                  <div className="text-lg font-bold text-indigo-700 text-center">{(index * 100).toFixed(2)}%</div>
                  <div className="text-xs text-gray-600 text-center mt-1">
                    {index > 1 ? `+${((index - 1) * 100).toFixed(2)}%` : `${((index - 1) * 100).toFixed(2)}%`}
                  </div>
                </div>
              ))}
            </div>

            <div className="text-sm text-gray-700 space-y-1">
              <p><strong>Product of indices:</strong> {(seasonalData.finalProduct).toFixed(6)} ≈ 1.0000 ✓</p>
              <p><strong>Correction factor applied:</strong> {seasonalData.correctionFactor.toFixed(6)}</p>
              <p className="text-xs italic">Note: In multiplicative model, product of seasonal indices must equal 1</p>
            </div>
          </div>

          {/* Model Accuracy Metrics */}
          <div className="mt-6 bg-green-50 p-4 rounded-lg border-2 border-green-200">
            <h3 className="font-bold text-lg mb-3 text-green-800">Model Accuracy Metrics</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white p-3 rounded-lg text-center">
                <div className="text-sm text-gray-600">Mean Absolute Error</div>
                <div className="text-2xl font-bold text-green-700">{accuracyMetrics.mae}</div>
              </div>
              <div className="bg-white p-3 rounded-lg text-center">
                <div className="text-sm text-gray-600">Mean Squared Error</div>
                <div className="text-2xl font-bold text-green-700">{accuracyMetrics.mse}</div>
              </div>
              <div className="bg-white p-3 rounded-lg text-center">
                <div className="text-sm text-gray-600">Root Mean Squared Error</div>
                <div className="text-2xl font-bold text-green-700">{accuracyMetrics.rmse}</div>
              </div>
            </div>
          </div>

          {/* Formulas */}
          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg border-2 border-blue-200">
              <h4 className="font-bold mb-2">Main Formulas (Multiplicative Model)</h4>
              <div className="space-y-2 text-sm">
                <p><strong>Trend (Least Squares):</strong> Tt = {trendB.toFixed(3)} + {trendA.toFixed(3)}t</p>
                <p><strong>Model:</strong> Yt = Tt × St × εt</p>
                <p><strong>Estimated series:</strong> Ŷt = Tt × St</p>
                <p><strong>Residuals:</strong> εt = Yt / Ŷt</p>
                <p><strong>CVS:</strong> CVSt = Yt / St</p>
              </div>
            </div>

            <div className="bg-green-50 p-4 rounded-lg border-2 border-green-200">
              <h4 className="font-bold mb-2">2022 Forecasts (Ŷt = Tt × St)</h4>
              <div className="space-y-1 text-sm">
                {forecasts2022.map(f => (
                  <p key={f.quarter}><strong>{f.quarter}:</strong> {f.forecast} units</p>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab menu */}
      <div className="flex flex-wrap gap-2 mb-6 bg-white p-2 rounded-lg shadow">
        {[
          { id: 'original', label: 'Original Data' },
          { id: 'trends', label: 'Trend Comparison' },
          { id: 'moving', label: 'Moving Average' },
          { id: 'seasonal', label: 'Seasonal Coefficients' },
          { id: 'estimated', label: 'Estimated Series' },
          { id: 'residuals', label: 'Residuals' },
          { id: 'cvs', label: 'CVS Series' },
          { id: 'forecast', label: '2022 Forecasts' },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 rounded-md transition-colors ${
              activeTab === tab.id
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        {/* 1. Original data */}
        {activeTab === 'original' && (
          <div>
            <h2 className="text-2xl font-bold mb-4 text-indigo-800">Quarterly Sales (2018-2021)</h2>
            <ResponsiveContainer width="100%" height={400}>
              <LineChart data={originalData.map(d => ({ ...d, label: `${d.year}-${d.quarter}` }))}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="label" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="sales" stroke="#8b5cf6" strokeWidth={3} name="Sales" dot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
            
            <div className="mt-6 p-4 bg-indigo-50 rounded-lg">
              <h3 className="font-bold text-lg mb-2">Comments:</h3>
              <ul className="list-disc list-inside space-y-2">
                <li>Clear upward trend in sales over the 4-year period</li>
                <li>Strong seasonal pattern: Q3 consistently has highest sales</li>
                <li>Q1 shows lowest sales across all years</li>
                <li>Seasonal amplitude increases with the trend level → Multiplicative model is appropriate</li>
                <li>The ratio Yt / Trend remains relatively stable, confirming multiplicative decomposition</li>
              </ul>
            </div>
          </div>
        )}

        {/* 2. Trend comparison */}
        {activeTab === 'trends' && (
          <div>
            <h2 className="text-2xl font-bold mb-4 text-indigo-800">Trend Estimation - Least Squares Method</h2>
            <ResponsiveContainer width="100%" height={400}>
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="label" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="sales" stroke="#8b5cf6" strokeWidth={2} name="Actual sales" dot={{ r: 4 }} />
                <Line type="monotone" dataKey="trendMC" stroke="#ef4444" strokeWidth={2} name="Trend (Least squares)" strokeDasharray="5 5" />
              </LineChart>
            </ResponsiveContainer>
            
            <div className="mt-6 p-4 bg-red-50 rounded-lg border-2 border-red-200">
              <h3 className="font-bold text-lg mb-2">Least Squares Method - Calculated Dynamically</h3>
              <p className="font-mono text-lg mb-3">T<sub>t</sub> = {trendB.toFixed(3)} + {trendA.toFixed(3)}t</p>
              <div className="text-sm space-y-1">
                <p><strong>Formulas used:</strong></p>
                <p>a = (n·ΣtY - Σt·ΣY) / (n·Σt² - (Σt)²)</p>
                <p>b = (ΣY - a·Σt) / n</p>
                <p className="mt-2"><strong>Where:</strong></p>
                <p>n = {originalData.length} observations</p>
              </div>
            </div>
          </div>
        )}

        {/* 3. Moving average */}
        {activeTab === 'moving' && (
          <div>
            <h2 className="text-2xl font-bold mb-4 text-indigo-800">Centered Moving Average (MMc4)</h2>
            <ResponsiveContainer width="100%" height={400}>
              <LineChart data={movingAvgData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="label" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="sales" stroke="#8b5cf6" strokeWidth={2} name="Actual sales" dot={{ r: 4 }} />
                <Line type="monotone" dataKey="mmc4" stroke="#f59e0b" strokeWidth={3} name="Centered MA (MMc4)" connectNulls />
              </LineChart>
            </ResponsiveContainer>
            
            <div className="mt-6 p-4 bg-orange-50 rounded-lg">
              <h3 className="font-bold text-lg mb-2">Centered Moving Average - Order 4</h3>
              <p className="mb-2">For quarterly data (even number of periods), we use a centered moving average:</p>
              <p className="font-mono text-sm">MMc4<sub>t</sub> = (MM4<sub>t</sub> + MM4<sub>t+1</sub>) / 2</p>
              <p className="mt-2">This eliminates seasonal fluctuations and shows the general trend more clearly.</p>
            </div>
          </div>
        )}

        {/* 4. Seasonal coefficients */}
        {activeTab === 'seasonal' && (
          <div>
            <h2 className="text-2xl font-bold mb-4 text-indigo-800">Seasonal Indices - Ratio-to-Moving-Average Method</h2>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={seasonalCoefficients}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="quarter" />
                <YAxis domain={[0.7, 1.3]} />
                <Tooltip />
                <Legend />
                <Bar dataKey="coefficient" fill="#8b5cf6" name="Seasonal index">
                  {seasonalCoefficients.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            
            <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
              {seasonalCoefficients.map(sc => (
                <div key={sc.quarter} className="p-4 rounded-lg text-center" style={{ backgroundColor: sc.color + '20', borderColor: sc.color, borderWidth: 2 }}>
                  <div className="font-bold text-lg">{sc.quarter}</div>
                  <div className="text-2xl font-bold mt-2" style={{ color: sc.color }}>
                    {(sc.coefficient * 100).toFixed(2)}%
                  </div>
                  <div className="text-sm mt-1">
                    {sc.coefficient > 1 ? '+' : ''}{((sc.coefficient - 1) * 100).toFixed(2)}%
                  </div>
                </div>
              ))}
            </div>
            
            <div className="mt-4 p-4 bg-indigo-50 rounded-lg">
              <p className="font-bold mb-2">Interpretation (Multiplicative Model):</p>
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>Seasonal index &gt; 1: Above-average period (positive seasonality)</li>
                <li>Seasonal index &lt; 1: Below-average period (negative seasonality)</li>
                <li>Seasonal index = 1: No seasonal effect</li>
                <li>Product of all indices = {seasonalData.finalProduct.toFixed(4)} ≈ 1.0000 ✓</li>
              </ul>
              <p className="mt-3 text-sm"><strong>Method:</strong> Calculate Yt/MMc4 for each observation, average by quarter, then adjust so product equals 1.</p>
            </div>
          </div>
        )}

        {/* 5. Estimated series */}
        {activeTab === 'estimated' && (
          <div>
            <h2 className="text-2xl font-bold mb-4 text-indigo-800">Estimated Series vs Actual (Multiplicative Model)</h2>
            <ResponsiveContainer width="100%" height={400}>
              <LineChart data={estimatedData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="label" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="sales" stroke="#8b5cf6" strokeWidth={3} name="Actual sales" dot={{ r: 5 }} />
                <Line type="monotone" dataKey="estimated" stroke="#10b981" strokeWidth={2} name="Estimated sales (Ŷt)" strokeDasharray="5 5" />
                <Line type="monotone" dataKey="trend" stroke="#ef4444" strokeWidth={1} name="Trend (Tt)" strokeDasharray="3 3" />
              </LineChart>
            </ResponsiveContainer>
            
            <div className="mt-6 p-4 bg-green-50 rounded-lg">
              <p className="font-bold">Multiplicative Model Equation:</p>
              <p className="font-mono text-lg mt-2">Y<sub>t</sub> = T<sub>t</sub> × S<sub>t</sub> × ε<sub>t</sub></p>
              <p className="mt-2"><strong>Estimated series:</strong> Ŷ<sub>t</sub> = T<sub>t</sub> × S<sub>t</sub></p>
              <p className="mt-2">where T<sub>t</sub> is the trend and S<sub>t</sub> is the seasonal index</p>
              <div className="mt-4 p-3 bg-white rounded border border-green-300">
                <p className="font-bold">Model Accuracy:</p>
                <p>MAE: {accuracyMetrics.mae} | MSE: {accuracyMetrics.mse} | RMSE: {accuracyMetrics.rmse}</p>
              </div>
            </div>
          </div>
        )}

        {/* 6. Residuals */}
        {activeTab === 'residuals' && (
          <div>
            <h2 className="text-2xl font-bold mb-4 text-indigo-800">Residuals - Random Component (εt)</h2>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={estimatedData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="label" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="residualRatio" fill="#8b5cf6" name="Residual Ratio (εt = Yt/Ŷt)" />
              </BarChart>
            </ResponsiveContainer>
            
            <div className="mt-6 p-4 bg-purple-50 rounded-lg">
              <p className="font-bold">Multiplicative Model Residuals:</p>
              <p className="font-mono text-lg mt-2">ε<sub>t</sub> = Y<sub>t</sub> / Ŷ<sub>t</sub></p>
              <p className="mt-2">Residuals represent the random/accidental component not explained by trend and seasonality</p>
              <p className="mt-2"><strong>Interpretation:</strong></p>
              <ul className="list-disc list-inside mt-1 text-sm">
                <li>ε<sub>t</sub> &gt; 1: Actual value is higher than predicted</li>
                <li>ε<sub>t</sub> &lt; 1: Actual value is lower than predicted</li>
                <li>ε<sub>t</sub> = 1: Perfect prediction</li>
              </ul>
            </div>
          </div>
        )}

        {/* 7. CVS series */}
        {activeTab === 'cvs' && (
          <div>
            <h2 className="text-2xl font-bold mb-4 text-indigo-800">Seasonally Adjusted Series (CVS)</h2>
            <ResponsiveContainer width="100%" height={400}>
              <LineChart data={cvsData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="label" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="sales" stroke="#8b5cf6" strokeWidth={2} name="Original sales" dot={{ r: 4 }} />
                <Line type="monotone" dataKey="cvs" stroke="#06b6d4" strokeWidth={3} name="CVS (deseasonalized)" dot={{ r: 5 }} />
              </LineChart>
            </ResponsiveContainer>
            
            <div className="mt-6 p-4 bg-cyan-50 rounded-lg">
              <p className="font-bold">Multiplicative Deseasonalization:</p>
              <p className="font-mono text-lg mt-2">CVS<sub>t</sub> = Y<sub>t</sub> / S<sub>t</sub></p>
              <p className="mt-2">The CVS (Corrigée des Variations Saisonnières) series removes the seasonal effect by dividing by the seasonal index, revealing the underlying trend and random component.</p>
              <p className="mt-2"><strong>Purpose:</strong> Allows comparison across different quarters without seasonal distortion.</p>
            </div>
          </div>
        )}

        {/* 8. 2022 Forecasts */}
        {activeTab === 'forecast' && (
          <div>
            <h2 className="text-2xl font-bold mb-4 text-indigo-800">Forecasts for 2022 (Multiplicative Model)</h2>
            <ResponsiveContainer width="100%" height={400}>
              <LineChart data={forecastData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="label" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="sales" stroke="#8b5cf6" strokeWidth={3} name="Actual sales" dot={{ r: 5 }} />
                <Line type="monotone" dataKey="estimated" stroke="#10b981" strokeWidth={3} name="Estimated/Forecast (Ŷt = Tt×St)" strokeDasharray="5 5" dot={{ r: 5 }} />
              </LineChart>
            </ResponsiveContainer>
            
            <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
              {forecasts2022.map(f => (
                <div key={f.quarter} className="p-4 bg-gradient-to-br from-red-50 to-orange-50 rounded-lg border-2 border-red-300">
                  <div className="font-bold text-lg text-center">{f.year} - {f.quarter}</div>
                  <div className="text-2xl font-bold text-center mt-2 text-red-600">
                    {Math.round(f.forecast)}
                  </div>
                  <div className="text-sm text-center text-gray-600 mt-1">units</div>
                  <div className="text-xs text-center text-gray-500 mt-1">
                    Trend × Seasonal
                  </div>
                </div>
              ))}
            </div>
            
            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
              <p className="font-bold">Forecast Formula (Multiplicative):</p>
              <p className="font-mono text-lg mt-2">Ŷ<sub>t</sub> = T<sub>t</sub> × S<sub>t</sub></p>
              <p className="mt-2">Where:</p>
              <ul className="list-disc list-inside text-sm mt-1">
                <li>T<sub>t</sub> = {trendB.toFixed(3)} + {trendA.toFixed(3)}t (linear trend)</li>
                <li>S<sub>t</sub> = seasonal index for the corresponding quarter</li>
              </ul>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="mt-6 text-center text-sm text-gray-600">
        <p>Time Series Analysis - Prof. Soumaya FELLAJI - Academic Year 2025/2026</p>
        <p className="mt-2 font-semibold text-indigo-700">Project managed by Mohamed Reda Touhami</p>
      </div>
    </div>
  );
};

export default function Home() {
  return <TimeSeriesAnalysis />;
}
