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

  // Calcul des tendances
  const calculateTrends = () => {
    return originalData.map(d => {
      // Méthode des moindres carrés
      const trendMC = 4854.625 + 233.5 * d.t;
      
      // Méthode semi-moyenne
      const trendSM = 5545.625 + 156.25 * d.t;
      
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
    
    for (let i = 0; i < data.length; i++) {
      if (i >= 1 && i < data.length - 2) {
        const sum = data[i-1].sales + data[i].sales + data[i+1].sales + data[i+2].sales;
        const mm4 = sum / 4;
        result.push({
          ...data[i],
          label: `${data[i].year}-${data[i].quarter}`,
          sales: data[i].sales,
          mm4: Math.round(mm4 * 100) / 100
        });
      } else {
        result.push({
          ...data[i],
          label: `${data[i].year}-${data[i].quarter}`,
          sales: data[i].sales,
          mm4: null
        });
      }
    }
    
    return result;
  };

  // Coefficients saisonniers
  const seasonalCoefficients = [
    { quarter: 'T1', coefficient: -993.5, color: '#ef4444' },
    { quarter: 'T2', coefficient: 335.5, color: '#10b981' },
    { quarter: 'T3', coefficient: 1102, color: '#3b82f6' },
    { quarter: 'T4', coefficient: -444, color: '#f59e0b' },
  ];

  // Calcul de la série estimée
  const calculateEstimatedSeries = () => {
    const seasonalMap: Record<string, number> = { 'T1': -993.5, 'T2': 335.5, 'T3': 1102, 'T4': -444 };
    
    return originalData.map(d => {
      const trend = 4854.625 + 233.5 * d.t;
      const seasonal = seasonalMap[d.quarter];
      const estimated = trend + seasonal;
      const residual = d.sales - estimated;
      
      return {
        ...d,
        label: `${d.year}-${d.quarter}`,
        trend: Math.round(trend * 100) / 100,
        estimated: Math.round(estimated * 100) / 100,
        residual: Math.round(residual * 100) / 100,
      };
    });
  };

  // Série corrigée des variations saisonnières (CVS)
  const calculateCVS = () => {
    const seasonalMap: Record<string, number> = { 'T1': -993.5, 'T2': 335.5, 'T3': 1102, 'T4': -444 };
    
    return originalData.map(d => {
      const cvs = d.sales - seasonalMap[d.quarter];
      
      return {
        ...d,
        label: `${d.year}-${d.quarter}`,
        cvs: Math.round(cvs * 100) / 100,
      };
    });
  };

  // Prévisions 2022
  const forecasts2022 = [
    { t: 17, year: 2022, quarter: 'T1', forecast: 7830.625 },
    { t: 18, year: 2022, quarter: 'T2', forecast: 9393.125 },
    { t: 19, year: 2022, quarter: 'T3', forecast: 10393.125 },
    { t: 20, year: 2022, quarter: 'T4', forecast: 9080.625 },
  ];

  // Calcul complet du tableau
  const calculateCompleteTable = () => {
    const seasonalMap: Record<string, number> = { 'T1': -993.5, 'T2': 335.5, 'T3': 1102, 'T4': -444 };
    
    return originalData.map(d => {
      const trend = 4854.625 + 233.5 * d.t;
      const seasonal = seasonalMap[d.quarter];
      const estimated = trend + seasonal;
      const residual = d.sales - estimated;
      const cvs = d.sales - seasonal;
      const ytMinusTrend = d.sales - trend;
      
      return {
        t: d.t,
        year: d.year,
        quarter: d.quarter,
        sales: d.sales,
        trend: Math.round(trend * 100) / 100,
        ytMinusTrend: Math.round(ytMinusTrend * 100) / 100,
        seasonal: seasonal,
        estimated: Math.round(estimated * 100) / 100,
        residual: Math.round(residual * 100) / 100,
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
        Time Series Analysis - Quarterly Sales
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
          <h2 className="text-2xl font-bold mb-4 text-indigo-800 text-center">Calculation Summary Table</h2>
          
          <div className="overflow-x-auto">
            <table className="min-w-full border-collapse border border-indigo-300">
              <thead>
                <tr className="bg-indigo-600 text-white">
                  <th className="border border-indigo-300 px-3 py-2">t</th>
                  <th className="border border-indigo-300 px-3 py-2">Year</th>
                  <th className="border border-indigo-300 px-3 py-2">Quarter</th>
                  <th className="border border-indigo-300 px-3 py-2">Sales (Yt)</th>
                  <th className="border border-indigo-300 px-3 py-2">Trend (Tt)</th>
                  <th className="border border-indigo-300 px-3 py-2">Yt - Tt</th>
                  <th className="border border-indigo-300 px-3 py-2">Seasonal Coeff. (St)</th>
                  <th className="border border-indigo-300 px-3 py-2">Estimated Series (Ŷt)</th>
                  <th className="border border-indigo-300 px-3 py-2">Residuals (ε̂t)</th>
                  <th className="border border-indigo-300 px-3 py-2">CVS</th>
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
                    <td className="border border-indigo-300 px-3 py-2 text-center">{row.ytMinusTrend}</td>
                    <td className="border border-indigo-300 px-3 py-2 text-center font-semibold" style={{
                      color: row.seasonal > 0 ? '#10b981' : '#ef4444'
                    }}>
                      {row.seasonal > 0 ? '+' : ''}{row.seasonal}
                    </td>
                    <td className="border border-indigo-300 px-3 py-2 text-center font-bold text-green-700">{row.estimated}</td>
                    <td className="border border-indigo-300 px-3 py-2 text-center">{row.residual}</td>
                    <td className="border border-indigo-300 px-3 py-2 text-center">{row.cvs}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Seasonal coefficients calculation details */}
          <div className="mt-6 bg-indigo-50 p-4 rounded-lg">
            <h3 className="font-bold text-lg mb-3 text-indigo-800">Seasonal Coefficients Calculation (Simple Averages Method)</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
              {[
                { trim: 'Q1', years: ['2018: -58.13', '2019: -742.13', '2020: -1426.13', '2021: -1610.13'], avg: -959.125, final: -993.5 },
                { trim: 'Q2', years: ['2018: 708.38', '2019: 524.38', '2020: 90.38', '2021: 156.38'], avg: 369.875, final: 335.5 },
                { trim: 'Q3', years: ['2018: 1474.88', '2019: 1040.88', '2020: 1106.88', '2021: 922.88'], avg: 1136.375, final: 1102 },
                { trim: 'Q4', years: ['2018: -8.63', '2019: -192.63', '2020: -626.63', '2021: -810.63'], avg: -409.625, final: -444 },
              ].map(item => (
                <div key={item.trim} className="bg-white p-3 rounded-lg border-2 border-indigo-200">
                  <div className="font-bold text-center text-lg mb-2">{item.trim}</div>
                  {item.years.map((y, i) => (
                    <div key={i} className="text-xs text-gray-600">{y}</div>
                  ))}
                  <div className="mt-2 pt-2 border-t border-indigo-200">
                    <div className="text-sm">Average: <span className="font-semibold">{item.avg}</span></div>
                    <div className="text-sm font-bold text-indigo-700">Adjusted: {item.final}</div>
                  </div>
                </div>
              ))}
            </div>

            <div className="text-sm text-gray-700">
              <p><strong>Correction:</strong> Sum = {-959.125 + 369.875 + 1136.375 - 409.625} = 137.5</p>
              <p>Correction per quarter = -137.5 / 4 = -34.375</p>
            </div>
          </div>

          {/* Formulas */}
          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg border-2 border-blue-200">
              <h4 className="font-bold mb-2">Main Formulas</h4>
              <div className="space-y-2 text-sm">
                <p><strong>Trend:</strong> Tt = 4854.625 + 233.5t</p>
                <p><strong>Estimated series:</strong> Ŷt = Tt + St</p>
                <p><strong>Residuals:</strong> ε̂t = Yt - Ŷt</p>
                <p><strong>CVS:</strong> CVSt = Yt - St</p>
              </div>
            </div>

            <div className="bg-green-50 p-4 rounded-lg border-2 border-green-200">
              <h4 className="font-bold mb-2">2022 Forecasts</h4>
              <div className="space-y-1 text-sm">
                <p><strong>Q1:</strong> 7830.625 units</p>
                <p><strong>Q2:</strong> 9393.125 units</p>
                <p><strong>Q3:</strong> 10393.125 units</p>
                <p><strong>Q4:</strong> 9080.625 units</p>
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
                <li>Clear upward trend in sales</li>
                <li>Recurring seasonal variations: Q3 has the highest sales</li>
                <li>Q1 and Q4 show lower sales</li>
                <li>Seasonal pattern remains relatively stable across years</li>
              </ul>
            </div>
          </div>
        )}

        {/* 2. Trend comparison */}
        {activeTab === 'trends' && (
          <div>
            <h2 className="text-2xl font-bold mb-4 text-indigo-800">Comparison of Trend Estimation Methods</h2>
            <ResponsiveContainer width="100%" height={400}>
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="label" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="sales" stroke="#8b5cf6" strokeWidth={2} name="Actual sales" dot={{ r: 4 }} />
                <Line type="monotone" dataKey="trendMC" stroke="#ef4444" strokeWidth={2} name="Least squares" strokeDasharray="5 5" />
                <Line type="monotone" dataKey="trendSM" stroke="#10b981" strokeWidth={2} name="Semi-average" strokeDasharray="5 5" />
              </LineChart>
            </ResponsiveContainer>
            
            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-red-50 rounded-lg border-2 border-red-200">
                <h3 className="font-bold text-lg mb-2">Least Squares Method</h3>
                <p className="font-mono text-lg">T<sub>t</sub> = 4854.625 + 233.5t</p>
                <p className="text-sm mt-2">Most statistically precise method</p>
              </div>
              
              <div className="p-4 bg-green-50 rounded-lg border-2 border-green-200">
                <h3 className="font-bold text-lg mb-2">Semi-Average Method</h3>
                <p className="font-mono text-lg">T<sub>t</sub> = 5545.625 + 156.25t</p>
                <p className="text-sm mt-2">Simple and quick method</p>
              </div>
            </div>
          </div>
        )}

        {/* 3. Moving average */}
        {activeTab === 'moving' && (
          <div>
            <h2 className="text-2xl font-bold mb-4 text-indigo-800">Moving Average (Order 4)</h2>
            <ResponsiveContainer width="100%" height={400}>
              <LineChart data={movingAvgData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="label" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="sales" stroke="#8b5cf6" strokeWidth={2} name="Actual sales" dot={{ r: 4 }} />
                <Line type="monotone" dataKey="mm4" stroke="#f59e0b" strokeWidth={3} name="Moving average" connectNulls />
              </LineChart>
            </ResponsiveContainer>
            
            <div className="mt-6 p-4 bg-orange-50 rounded-lg">
              <h3 className="font-bold text-lg mb-2">Note:</h3>
              <p>The moving average eliminates seasonal fluctuations and shows the general trend more clearly</p>
            </div>
          </div>
        )}

        {/* 4. Seasonal coefficients */}
        {activeTab === 'seasonal' && (
          <div>
            <h2 className="text-2xl font-bold mb-4 text-indigo-800">Seasonal Coefficients (Simple Averages Method)</h2>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={seasonalCoefficients}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="quarter" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="coefficient" fill="#8b5cf6" name="Seasonal coefficient">
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
                    {sc.coefficient > 0 ? '+' : ''}{sc.coefficient}
                  </div>
                </div>
              ))}
            </div>
            
            <div className="mt-4 p-4 bg-indigo-50 rounded-lg">
              <p className="font-bold">Interpretation:</p>
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>Q3: Highest seasonality (+1102)</li>
                <li>Q2: Positive seasonality (+335.5)</li>
                <li>Q1: Lowest seasonality (-993.5)</li>
                <li>Q4: Negative seasonality (-444)</li>
              </ul>
            </div>
          </div>
        )}

        {/* 5. Estimated series */}
        {activeTab === 'estimated' && (
          <div>
            <h2 className="text-2xl font-bold mb-4 text-indigo-800">Estimated Series vs Actual</h2>
            <ResponsiveContainer width="100%" height={400}>
              <LineChart data={estimatedData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="label" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="sales" stroke="#8b5cf6" strokeWidth={3} name="Actual sales" dot={{ r: 5 }} />
                <Line type="monotone" dataKey="estimated" stroke="#10b981" strokeWidth={2} name="Estimated sales" strokeDasharray="5 5" />
                <Line type="monotone" dataKey="trend" stroke="#ef4444" strokeWidth={1} name="Trend" strokeDasharray="3 3" />
              </LineChart>
            </ResponsiveContainer>
            
            <div className="mt-6 p-4 bg-green-50 rounded-lg">
              <p className="font-bold">Equation:</p>
              <p className="font-mono text-lg mt-2">Ŷ<sub>t</sub> = T<sub>t</sub> + S<sub>t</sub></p>
              <p className="mt-2">where T<sub>t</sub> is the trend and S<sub>t</sub> is the seasonal coefficient</p>
            </div>
          </div>
        )}

        {/* 6. Residuals */}
        {activeTab === 'residuals' && (
          <div>
            <h2 className="text-2xl font-bold mb-4 text-indigo-800">Residuals (Accidental Variations)</h2>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={estimatedData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="label" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="residual" fill="#8b5cf6" name="Residuals (ε̂t)" />
              </BarChart>
            </ResponsiveContainer>
            
            <div className="mt-6 p-4 bg-purple-50 rounded-lg">
              <p className="font-bold">Equation:</p>
              <p className="font-mono text-lg mt-2">ε̂<sub>t</sub> = Y<sub>t</sub> - Ŷ<sub>t</sub></p>
              <p className="mt-2">Residuals represent the part not explained by the model (accidental variations)</p>
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
              <p className="font-bold">Equation:</p>
              <p className="font-mono text-lg mt-2">CVS<sub>t</sub> = Y<sub>t</sub> - S<sub>t</sub></p>
              <p className="mt-2">The CVS series eliminates the seasonal effect and reveals the actual trend</p>
            </div>
          </div>
        )}

        {/* 8. 2022 Forecasts */}
        {activeTab === 'forecast' && (
          <div>
            <h2 className="text-2xl font-bold mb-4 text-indigo-800">Forecasts for 2022</h2>
            <ResponsiveContainer width="100%" height={400}>
              <LineChart data={forecastData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="label" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="sales" stroke="#8b5cf6" strokeWidth={3} name="Actual sales" dot={{ r: 5 }} />
                <Line type="monotone" dataKey="estimated" stroke="#10b981" strokeWidth={3} name="Estimated/Forecast" strokeDasharray="5 5" dot={{ r: 5 }} />
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
                </div>
              ))}
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
