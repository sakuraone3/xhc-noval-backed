// test-api.js
// 简单的API测试脚本
const http = require('http');
const https = require('https');

/**
 * 简单的HTTP GET请求函数
 * @param {string} url - 请求的URL
 * @returns {Promise<any>} - 返回解析后的JSON响应
 */
function fetch(url) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http;
    
    protocol.get(url, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const parsedData = JSON.parse(data);
          resolve({ 
            status: res.statusCode, 
            json: parsedData // 直接返回解析后的数据
          });
        } catch (error) {
          // 即使解析失败，也返回响应状态和原始数据
          resolve({ 
            status: res.statusCode, 
            json: { error: 'Failed to parse JSON', rawData: data } 
          });
        }
      });
    }).on('error', (error) => {
      console.error(`请求 ${url} 失败:`, error.message);
      // 返回错误状态而不是reject，以便测试继续运行
      resolve({ 
        status: 500, 
        json: { error: error.message } 
      });
    });
  });
}

// 基础URL
const BASE_URL = 'http://localhost:3001';

/**
 * 打印测试结果
 * @param {string} testName - 测试名称
 * @param {boolean} success - 是否成功
 * @param {any} data - 测试数据
 */
function printTestResult(testName, success, data = null) {
  const status = success ? '✓ 成功' : '✗ 失败';
  console.log(`\n[${status}] ${testName}`);
  if (data && success) {
    try {
      const jsonString = JSON.stringify(data, null, 2);
      const truncated = jsonString.length > 500 ? jsonString.substring(0, 500) + '...' : jsonString;
      console.log('响应数据:', truncated);
    } catch (error) {
      console.log('响应数据: [无法解析]');
    }
  }
}

/**
 * 测试健康检查端点
 */
async function testHealthEndpoint() {
  try {
    const response = await fetch(`${BASE_URL}/health`);
    const data = response.json;
    
    if (response.status === 200 && data.status === 'ok') {
      printTestResult('健康检查端点', true, data);
      return true;
    } else {
      printTestResult('健康检查端点', false);
      return false;
    }
  } catch (error) {
    console.error('健康检查失败:', error.message);
    printTestResult('健康检查端点', false);
    return false;
  }
}

/**
 * 测试小说列表API
 */
async function testNovelsListEndpoint() {
  try {
    const response = await fetch(`${BASE_URL}/api/novels`);
    const data = response.json;
    
    if (response.status === 200) {
      printTestResult('小说列表API', true, data);
      return true;
    } else {
      printTestResult('小说列表API', false);
      return false;
    }
  } catch (error) {
    console.error('小说列表请求失败:', error.message);
    printTestResult('小说列表API', false);
    return false;
  }
}

/**
 * 测试EPUB文件列表API
 */
async function testEpubListEndpoint() {
  try {
    const response = await fetch(`${BASE_URL}/api/epub`);
    const data = response.json;
    
    if (response.status === 200) {
      printTestResult('EPUB文件列表API', true, data);
      return true;
    } else {
      printTestResult('EPUB文件列表API', false);
      return false;
    }
  } catch (error) {
    console.error('EPUB文件列表请求失败:', error.message);
    printTestResult('EPUB文件列表API', false);
    return false;
  }
}

/**
 * 测试SSR小说列表API
 */
async function testSsrNovelsEndpoint() {
  try {
    const response = await fetch(`${BASE_URL}/api/ssr/novels`);
    const data = response.json;
    
    if (response.status === 200) {
      printTestResult('SSR小说列表API', true, data);
      return true;
    } else {
      printTestResult('SSR小说列表API', false);
      return false;
    }
  } catch (error) {
    console.error('SSR小说列表请求失败:', error.message);
    printTestResult('SSR小说列表API', false);
    return false;
  }
}

/**
 * 运行所有测试
 */
async function runAllTests() {
  console.log('开始API测试...');
  console.log(`测试目标: ${BASE_URL}`);
  console.log('=======================');
  
  let passedTests = 0;
  let totalTests = 0;
  
  // 运行测试并统计结果
  const results = await Promise.all([
    testHealthEndpoint(),
    testNovelsListEndpoint(),
    testEpubListEndpoint(),
    testSsrNovelsEndpoint()
  ]);
  
  // 计算通过的测试数量
  passedTests = results.filter(result => result).length;
  totalTests = results.length;
  
  console.log('\n=======================');
  console.log(`测试完成: 通过 ${passedTests}/${totalTests} 个测试`);
  
  // 如果所有测试都通过，显示成功消息
  if (passedTests === totalTests) {
    console.log('🎉 所有API测试通过!');
  } else {
    console.log('❌ 有测试未通过，请检查API服务。');
  }
}

// 运行测试
runAllTests();
