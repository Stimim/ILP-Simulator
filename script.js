const RiskCoeffs = [ [0.27, 0.21], [0.16, 0.12], [0.14, 0.10], [0.12, 0.09],
[0.10, 0.08], [0.10, 0.07], [0.09, 0.07], [0.09, 0.07], [0.10, 0.06], [0.10,
0.06], [0.10, 0.06], [0.11, 0.06], [0.13, 0.06], [0.15, 0.07], [0.19, 0.08],
[0.25, 0.11], [0.28, 0.12], [0.32, 0.13], [0.34, 0.14], [0.36, 0.15], [0.36,
0.15], [0.37, 0.16], [0.38, 0.16], [0.39, 0.17], [0.39, 0.17], [0.41, 0.20],
[0.42, 0.21], [0.43, 0.22], [0.45, 0.23], [0.47, 0.24], [0.55, 0.26], [0.58,
0.28], [0.62, 0.30], [0.67, 0.32], [0.73, 0.34], [0.81, 0.37], [0.89, 0.40],
[0.97, 0.43], [1.06, 0.46], [1.16, 0.50], [1.27, 0.55], [1.39, 0.59], [1.51,
0.64], [1.64, 0.69], [1.78, 0.74], [2.01, 0.85], [2.17, 0.91], [2.34, 0.98],
[2.52, 1.05], [2.71, 1.13], [2.89, 1.19], [3.10, 1.27], [3.32, 1.37], [3.56,
1.46], [3.82, 1.56], [4.22, 1.80], [4.51, 1.92], [4.84, 2.06], [5.19, 2.22],
[5.57, 2.41], [6.22, 2.77], [6.67, 3.00], [7.18, 3.27], [7.74, 3.57], [8.37,
3.91], [9.39, 4.67], [10.19, 5.12], [11.12, 5.66], [12.18, 6.27], [13.36, 6.97],
[15.42, 8.10], [16.86, 9.00], [18.43, 10.04], [20.14, 11.21], [22.02, 12.54],
[23.90, 13.61], [26.17, 15.26], [28.66, 17.12], [31.41, 19.18], [34.40, 21.47],
[37.65, 23.99], [41.15, 26.76], [44.93, 29.82], [49.04, 33.22], [53.53, 37.01],
[58.46, 41.28], [63.90, 46.09], [69.89, 51.51], [76.25, 57.60], [82.96, 64.40],
[90.68, 71.99], [99.60, 80.42], [108.45, 89.76], [118.10, 100.11], [128.61,
111.53], [140.07, 124.14], [152.57, 138.04], [166.19, 153.31], [181.04, 170.05],
[197.23, 188.36], [214.87, 208.32], [233.56, 229.99], [252.82, 253.43], [273.28,
278.66], [294.95, 305.67], [317.80, 334.39], [352.52, 374.03], [390.26, 415.61],
[427.12, 463.77], [465.49, 516.22], [833.33, 833.33], ];

document.getElementById("simForm").addEventListener("submit", function (event) {
    event.preventDefault();

    // 獲取輸入參數
    let sex = parseInt(document.getElementById("sex").value);
    let initialInvestment = parseFloat(document.getElementById("initialInvestment").value);
    let insuranceAmount = parseFloat(document.getElementById("insuranceAmount").value);
    let annualPremium = parseFloat(document.getElementById("annualPremium").value);
    let ageStart = parseInt(document.getElementById("ageStart").value);
    let ageEnd = parseInt(document.getElementById("ageEnd").value);
    let investmentYears = parseInt(document.getElementById("investmentYears").value);
    let meanReturn = parseFloat(document.getElementById("meanReturn").value) / 100;
    let stdDev = parseFloat(document.getElementById("stdDev").value) / 100;
    let numYears = ageEnd - ageStart + 1;
    let numSimulations = 1000;
    let policyFee = parseFloat(document.getElementById("policyFee").value);
    let expenseRatio = parseFloat(document.getElementById("expenseRatio").value) / 100;

    if (ageStart > ageEnd) {
        alert("開始年齡須小於結束年齡");
        return;
    }

    // 費用設定
    let premiumFeeRates = GetPremiumFeeRates();

    // 蒙地卡羅模擬
    let allSimulations = [];

    for (let i = 0; i < numSimulations; i++) {
        let portfolioValue = initialInvestment;
        let values = [];

        for (let year = 0; year < numYears; year++) {
            let feeRate = (year < premiumFeeRates.length) ? premiumFeeRates[year] : 0;
            let feeCost = annualPremium * feeRate;

            let investmentReturn = gaussianRandom(meanReturn, stdDev);

            if (year < investmentYears) {
                portfolioValue += annualPremium;
                portfolioValue -= feeCost;
            }
            portfolioValue -= policyFee;

            if (portfolioValue < insuranceAmount) {
                let riskAmount = insuranceAmount - portfolioValue;
                let riskCoeff = RiskCoeffs[ageStart + year][sex];
                let insuranceCost = (riskAmount / 10000) * riskCoeff * 12;
                portfolioValue -= insuranceCost;
            }

            portfolioValue *= (1 + investmentReturn);
            portfolioValue *= (1 - expenseRatio);
            values.push(portfolioValue);
        }

        allSimulations.push(values);
    }

    // 計算統計數據
    let percentiles = [0.05, 0.10, 0.30, 0.5, 0.7, 0.9];
    let results = {};

    percentiles.forEach(p => {
        results[`${p * 100}th Percentile`] = [];
    });

    for (let year = 0; year < numYears; year++) {
        let yearlyValues = allSimulations.map(sim => sim[year]);
        yearlyValues.sort((a, b) => a - b);

        percentiles.forEach(p => {
            let index = Math.floor(p * numSimulations);
            results[`${p * 100}th Percentile`].push(yearlyValues[index]);
        });
    }

    // 畫圖
    let traces = [];
    percentiles.forEach(p => {
        traces.push({
            x: Array.from({ length: numYears }, (_, i) => ageStart + i),
            y: results[`${p * 100}th Percentile`],
            mode: 'lines',
            name: `${p * 100}th Percentile`
        });
    });

    let layout = {
        title: `${meanReturn * 100}% 投資回報; 投資 ${investmentYears} 年後停止`,
        xaxis: { title: "年齡" },
        yaxis: { title: "保單淨值（元）", range: [-100, insuranceAmount * 1.5] }
    };

    Plotly.newPlot("chart", traces, layout);
});

// 隨機數生成 (高斯分佈)
function gaussianRandom(mean, stddev) {
    const u = 1 - Math.random(); // Converting [0,1) to (0,1]
    const v = Math.random();
    const z = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
    // Transform to the desired mean and standard deviation:
    return z * stddev + mean;
}


function GetPremiumFeeRates() {
    let premiumFeeRates = []
    document.getElementsByName("premiumFeeRates[]").forEach(
        (element) => {
            premiumFeeRates.push(parseFloat(element.value) / 100);
        }
    )
    return premiumFeeRates;
}
