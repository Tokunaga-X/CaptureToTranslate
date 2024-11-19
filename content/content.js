chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "initializeCapture") {
    initializeScreenCapture();
  }
});

async function initializeScreenCapture() {
  // 创建截图区域选择界面
  const overlay = document.createElement("div");
  overlay.style.position = "fixed";
  overlay.style.top = "0";
  overlay.style.left = "0";
  overlay.style.width = "100%";
  overlay.style.height = "100%";
  overlay.style.backgroundColor = "rgba(0,0,0,0.3)";
  overlay.style.zIndex = "99999";

  document.body.appendChild(overlay);

  // 实现截图区域选择逻辑
  let startX,
    startY,
    isDrawing = false;

  overlay.addEventListener("mousedown", startDrawing);
  overlay.addEventListener("mousemove", draw);
  overlay.addEventListener("mouseup", endDrawing);

  function startDrawing(e) {
    isDrawing = true;
    startX = e.clientX;
    startY = e.clientY;
  }

  function draw(e) {
    if (!isDrawing) return;
    // 绘制选择框
  }

  function endDrawing(e) {
    if (!isDrawing) return;
    isDrawing = false;
    // 获取选择区域的截图
    captureSelectedArea(startX, startY, e.clientX, e.clientY);
    overlay.remove();
  }
}

function captureSelectedArea(startX, startY, endX, endY) {
  // 确保坐标正确（处理用户从右下角向左上角拖动的情况）
  const [x1, x2] = [Math.min(startX, endX), Math.max(startX, endX)];
  const [y1, y2] = [Math.min(startY, endY), Math.max(startY, endY)];
  const width = x2 - x1;
  const height = y2 - y1;

  // 创建canvas元素
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");

  // 使用html2canvas捕获选定区域
  html2canvas(document.body, {
    x: x1,
    y: y1,
    width: width,
    height: height,
    useCORS: true,
    allowTaint: true,
  }).then((canvas) => {
    // 将截图转换为base64数据
    const imageData = canvas.toDataURL("image/png");
    // 发送消息给popup
    chrome.runtime.sendMessage({
      action: "processImage",
      imageData: imageData,
    });
  });
}
