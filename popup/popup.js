document.addEventListener("DOMContentLoaded", function () {
  const captureBtn = document.getElementById("captureBtn");
  const imageUpload = document.getElementById("imageUpload");
  const targetLang = document.getElementById("targetLang");

  captureBtn.addEventListener("click", async () => {
    try {
      // 发送消息给background script开始截图
      chrome.runtime.sendMessage({ action: "startCapture" });
    } catch (error) {
      console.error("截图错误:", error);
    }
  });

  imageUpload.addEventListener("change", async (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const imageData = e.target.result;
        processImage(imageData);
      };
      reader.readAsDataURL(file);
    }
  });

  async function processImage(imageData) {
    try {
      showLoading(true);
      const text = await recognizeText(imageData);
      const translatedText = await translateText(text, targetLang.value);
      displayResults(text, translatedText);
    } catch (error) {
      console.error("处理图片错误:", error);
      displayError(error.message);
    } finally {
      showLoading(false);
    }
  }

  function displayResults(originalText, translatedText) {
    document.getElementById("originalText").textContent = originalText;
    document.getElementById("translatedText").textContent = translatedText;
  }
});

// 这些函数需要实现具体的API调用
async function recognizeText(imageData) {
  try {
    const response = await fetch(CONFIG.OPENAI_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${CONFIG.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4-vision-preview",
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "请识别这张图片中的文字，只返回文字内容，不需要其他解释。",
              },
              {
                type: "image_url",
                image_url: {
                  url: imageData,
                },
              },
            ],
          },
        ],
        max_tokens: 500,
      }),
    });

    const data = await response.json();
    if (data.error) {
      throw new Error(data.error.message);
    }
    return data.choices[0].message.content;
  } catch (error) {
    console.error("OCR错误:", error);
    throw error;
  }
}

async function translateText(text, targetLang) {
  try {
    const response = await fetch(CONFIG.OPENAI_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${CONFIG.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4",
        messages: [
          {
            role: "user",
            content: `请将以下文字翻译成${
              targetLang === "zh"
                ? "中文"
                : targetLang === "en"
                ? "英文"
                : "日文"
            }：\n\n${text}`,
          },
        ],
        max_tokens: 500,
      }),
    });

    const data = await response.json();
    if (data.error) {
      throw new Error(data.error.message);
    }
    return data.choices[0].message.content;
  } catch (error) {
    console.error("翻译错误:", error);
    throw error;
  }
}

// 添加加载状态和错误显示功能
function showLoading(isLoading) {
  const resultContainer = document.getElementById("result");
  if (isLoading) {
    resultContainer.innerHTML = '<div class="loading">处理中...</div>';
  }
}

function displayError(message) {
  const resultContainer = document.getElementById("result");
  resultContainer.innerHTML = `<div class="error">${message}</div>`;
}
