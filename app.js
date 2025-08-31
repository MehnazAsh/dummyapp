// Global variables
let qrCodeDataURL = null;
let generatedPhoneNumber = null;
let qrImageBlob = null;

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    initializeEventListeners();
});

// Initialize all event listeners
function initializeEventListeners() {
    const phoneInput = document.getElementById('phoneNumber');
    
    // Format phone number as user types
    phoneInput.addEventListener('input', function(e) {
        this.value = this.value.replace(/\D/g, '');
        
        // Enable/disable generate button based on input
        const generateBtn = document.getElementById('generateBtn');
        if (this.value.length >= 7) {
            generateBtn.style.opacity = '1';
        } else {
            generateBtn.style.opacity = '0.7';
        }
    });

    // Allow Enter key to generate QR code
    phoneInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter' && this.value.length >= 7) {
            generateQRCode();
        }
    });
}

// Generate QR Code with embedded image
function generateQRCode() {
    const countryCode = document.getElementById('countryCode').value;
    const phoneNumber = document.getElementById('phoneNumber').value.trim();
    
    // Validate
    if (!phoneNumber || phoneNumber.length < 7) {
        showMessage('Please enter a valid phone number (at least 7 digits)', 'error');
        return;
    }
    
    // Store the phone number
    generatedPhoneNumber = countryCode + phoneNumber;
    
    // Show loading
    const placeholder = document.getElementById('placeholder');
    const loading = document.getElementById('loading');
    const qrImage = document.getElementById('qrImage');
    
    placeholder.style.display = 'none';
    qrImage.style.display = 'none';
    loading.style.display = 'block';
    
    // Generate QR code after a brief delay
    setTimeout(() => {
        createStyledQRCode(generatedPhoneNumber);
    }, 300);
}

// Create styled QR code with branding
function createStyledQRCode(phoneNumber) {
    const canvas = document.getElementById('processCanvas');
    const ctx = canvas.getContext('2d');
    
    // Set canvas size
    const canvasSize = 400;
    const qrSize = 280;
    canvas.width = canvasSize;
    canvas.height = canvasSize + 60; // Extra space for text
    
    // Create gradient background
    const gradient = ctx.createLinearGradient(0, 0, canvasSize, canvasSize + 60);
    gradient.addColorStop(0, '#f8fafb');
    gradient.addColorStop(1, '#ffffff');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvasSize, canvasSize + 60);
    
    // Add decorative border
    ctx.strokeStyle = '#667eea';
    ctx.lineWidth = 3;
    ctx.strokeRect(10, 10, canvasSize - 20, canvasSize + 40);
    
    // Create temporary div for QR code generation
    const tempDiv = document.createElement('div');
    tempDiv.style.position = 'absolute';
    tempDiv.style.left = '-9999px';
    document.body.appendChild(tempDiv);
    
    // Generate QR code
    new QRCode(tempDiv, {
        text: `tel:${phoneNumber}`,
        width: qrSize,
        height: qrSize,
        colorDark: "#2d3748",
        colorLight: "#ffffff",
        correctLevel: QRCode.CorrectLevel.H
    });
    
    // Wait for QR code to be generated
    setTimeout(() => {
        const qrCanvas = tempDiv.querySelector('canvas');
        if (qrCanvas) {
            // Draw QR code centered
            const qrX = (canvasSize - qrSize) / 2;
            const qrY = 50;
            
            // Add white background for QR code
            ctx.fillStyle = 'white';
            ctx.fillRect(qrX - 10, qrY - 10, qrSize + 20, qrSize + 20);
            
            // Add shadow for QR code
            ctx.shadowColor = 'rgba(0, 0, 0, 0.1)';
            ctx.shadowBlur = 10;
            ctx.shadowOffsetX = 0;
            ctx.shadowOffsetY = 2;
            
            // Draw QR code
            ctx.drawImage(qrCanvas, qrX, qrY);
            
            // Reset shadow
            ctx.shadowColor = 'transparent';
            ctx.shadowBlur = 0;
            ctx.shadowOffsetX = 0;
            ctx.shadowOffsetY = 0;
            
            // Add phone icon
            ctx.font = '24px Arial';
            ctx.fillStyle = '#667eea';
            ctx.textAlign = 'center';
            ctx.fillText('📱', canvasSize / 2, 35);
            
            // Add phone number text
            ctx.font = 'bold 18px -apple-system, BlinkMacSystemFont, Segoe UI, Roboto';
            ctx.fillStyle = '#2d3748';
            ctx.textAlign = 'center';
            ctx.fillText(phoneNumber, canvasSize / 2, qrY + qrSize + 35);
            
            // Add bottom text
            ctx.font = '12px -apple-system, BlinkMacSystemFont, Segoe UI, Roboto';
            ctx.fillStyle = '#718096';
            ctx.fillText('Scan to call', canvasSize / 2, qrY + qrSize + 55);
            
            // Convert to blob and display
            canvas.toBlob((blob) => {
                qrImageBlob = blob;
                qrCodeDataURL = URL.createObjectURL(blob);
                displayQRCode(qrCodeDataURL);
            }, 'image/png');
        }
        
        // Clean up
        document.body.removeChild(tempDiv);
    }, 100);
}

// Display the generated QR code
function displayQRCode(dataURL) {
    const loading = document.getElementById('loading');
    const qrImage = document.getElementById('qrImage');
    const qrContainer = document.getElementById('qrContainer');
    const actionButtons = document.getElementById('actionButtons');
    
    // Hide loading, show image
    loading.style.display = 'none';
    qrImage.src = dataURL;
    qrImage.style.display = 'block';
    qrContainer.classList.add('has-qr');
    actionButtons.style.display = 'grid';
    
    // Enable WhatsApp button with pulse effect
    const whatsappBtn = document.getElementById('whatsappBtn');
    whatsappBtn.disabled = false;
    whatsappBtn.classList.add('active', 'pulse');
    
    // Show success message
    showMessage('QR Code generated successfully! Click "Send to WhatsApp" to share.', 'success');
    
    // Remove pulse after 3 seconds
    setTimeout(() => {
        whatsappBtn.classList.remove('pulse');
    }, 3000);
}

// Send to WhatsApp
async function sendToWhatsApp() {
    if (!qrImageBlob) {
        showMessage('Please generate a QR code first', 'error');
        return;
    }
    
    showMessage('Opening WhatsApp...', 'info');
    
    // First, download the image
    downloadQRCode(false);
    
    // Create message
    const message = `QR Code for ${generatedPhoneNumber}\n\nScan this code to call directly!`;
    const encodedMessage = encodeURIComponent(message);
    
    // Check if on mobile or desktop
    if (isMobileDevice()) {
        // For mobile: Try to use Web Share API first
        if (navigator.share && navigator.canShare) {
            try {
                const file = new File([qrImageBlob], `QR_${generatedPhoneNumber}.png`, { type: 'image/png' });
                await navigator.share({
                    title: 'QR Code',
                    text: message,
                    files: [file]
                });
                showMessage('Shared successfully!', 'success');
            } catch (err) {
                // Fallback to WhatsApp URL scheme
                window.location.href = `whatsapp://send?text=${encodedMessage}`;
            }
        } else {
            // Direct WhatsApp open
            window.location.href = `whatsapp://send?text=${encodedMessage}`;
        }
    } else {
        // For desktop: Open WhatsApp Web
        window.open(`https://web.whatsapp.com/send?text=${encodedMessage}`, '_blank');
        
        // Show instruction
        setTimeout(() => {
            showMessage('WhatsApp Web opened! Attach the downloaded QR code image to your message.', 'info');
        }, 1000);
    }
}

// Download QR Code
function downloadQRCode(showMsg = true) {
    if (!qrCodeDataURL) {
        showMessage('No QR code to download', 'error');
        return;
    }
    
    const link = document.getElementById('downloadLink');
    link.href = qrCodeDataURL;
    link.download = `QR_${generatedPhoneNumber}_${Date.now()}.png`;
    link.click();
    
    if (showMsg) {
        showMessage('QR Code downloaded successfully!', 'success');
    }
}

// Copy image to clipboard
async function copyToClipboard() {
    if (!qrImageBlob) {
        showMessage('No QR code to copy', 'error');
        return;
    }
    
    try {
        // Check if Clipboard API is available
        if (navigator.clipboard && window.ClipboardItem) {
            const item = new ClipboardItem({ 'image/png': qrImageBlob });
            await navigator.clipboard.write([item]);
            showMessage('QR Code copied to clipboard!', 'success');
        } else {
            showMessage('Clipboard not supported on this browser', 'error');
        }
    } catch (err) {
        showMessage('Failed to copy to clipboard', 'error');
    }
}

// Share QR Code using Web Share API
async function shareQRCode() {
    if (!qrImageBlob) {
        showMessage('No QR code to share', 'error');
        return;
    }
    
    // Check if Web Share API is available
    if (navigator.share && navigator.canShare) {
        try {
            const file = new File([qrImageBlob], `QR_${generatedPhoneNumber}.png`, { type: 'image/png' });
            
            if (navigator.canShare({ files: [file] })) {
                await navigator.share({
                    title: 'Phone QR Code',
                    text: `QR Code for ${generatedPhoneNumber}`,
                    files: [file]
                });
                showMessage('Shared successfully!', 'success');
            } else {
                // Fallback to download
                downloadQRCode();
            }
        } catch (err) {
            if (err.name !== 'AbortError') {
                showMessage('Sharing failed', 'error');
            }
        }
    } else {
        // Fallback to download
        downloadQRCode();
        showMessage('Share not supported, file downloaded instead', 'info');
    }
}

// Show message
function showMessage(text, type = 'info') {
    const messageEl = document.getElementById('message');
    messageEl.textContent = text;
    messageEl.className = `message ${type}`;
    messageEl.style.display = 'block';
    
    // Auto hide after 4 seconds
    setTimeout(() => {
        messageEl.style.display = 'none';
    }, 4000);
}

// Check if mobile device
function isMobileDevice() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

// Export functions for onclick handlers
window.generateQRCode = generateQRCode;
window.sendToWhatsApp = sendToWhatsApp;
window.downloadQRCode = downloadQRCode;
window.copyToClipboard = copyToClipboard;
window.shareQRCode = shareQRCode;
