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
                const url = URL.createObjectURL(blob);
                qrCodeDataURL = canvas.toDataURL('image/png');
                displayQRCode(url);
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
    showMessage('QR Code generated successfully!', 'success');
    
    // Remove pulse after 3 seconds
    setTimeout(() => {
        whatsappBtn.classList.remove('pulse');
    }, 3000);
}

// Send to WhatsApp - Fixed version
async function sendToWhatsApp() {
    if (!qrImageBlob) {
        showMessage('Please generate a QR code first', 'error');
        return;
    }
    
    const isMobile = isMobileDevice();
    
    // For mobile devices with Web Share API support
    if (isMobile && navigator.share) {
        try {
            // Check if we can share files
            const file = new File([qrImageBlob], `QR_${generatedPhoneNumber}.png`, { 
                type: 'image/png',
                lastModified: Date.now()
            });
            
            if (navigator.canShare && navigator.canShare({ files: [file] })) {
                await navigator.share({
                    files: [file],
                    title: 'Phone QR Code',
                    text: `QR Code for ${generatedPhoneNumber}`
                });
                showMessage('Select WhatsApp from the share menu', 'success');
            } else {
                // Fallback for devices that can't share files
                fallbackWhatsAppShare();
            }
        } catch (err) {
            console.error('Share failed:', err);
            fallbackWhatsAppShare();
        }
    } else {
        // For desktop or devices without share API
        fallbackWhatsAppShare();
    }
}

// Fallback WhatsApp sharing method
function fallbackWhatsAppShare() {
    // Convert blob to base64 for display
    const reader = new FileReader();
    reader.onloadend = function() {
        const base64data = reader.result;
        
        // Create a temporary link to download
        const tempLink = document.createElement('a');
        tempLink.href = base64data;
        tempLink.download = `QR_${generatedPhoneNumber}.png`;
        
        // Show instructions based on device
        if (isMobileDevice()) {
            showMessage('Tap and hold the QR code above → Save Image → Open WhatsApp → Share', 'info');
            
            // Open WhatsApp after a delay
            setTimeout(() => {
                window.location.href = 'whatsapp://send';
            }, 2000);
        } else {
            // For desktop
            showMessage('Right-click the QR code → Save Image → Open WhatsApp Web → Attach and send', 'info');
            
            // Open WhatsApp Web
            setTimeout(() => {
                window.open('https://web.whatsapp.com/', '_blank');
            }, 2000);
        }
    };
    reader.readAsDataURL(qrImageBlob);
}

// Download QR Code
function downloadQRCode() {
    if (!qrCodeDataURL) {
        showMessage('No QR code to download', 'error');
        return;
    }
    
    const link = document.getElementById('downloadLink');
    link.href = qrCodeDataURL;
    link.download = `QR_${generatedPhoneNumber}_${Date.now()}.png`;
    link.click();
    
    showMessage('QR Code downloaded successfully!', 'success');
}

// Copy image to clipboard
async function copyToClipboard() {
    if (!qrImageBlob) {
        showMessage('No QR code to copy', 'error');
        return;
    }
    
    try {
        // Try to use the Clipboard API
        if (navigator.clipboard && window.ClipboardItem) {
            const item = new ClipboardItem({ 'image/png': qrImageBlob });
            await navigator.clipboard.write([item]);
            showMessage('QR Code copied! Paste it in WhatsApp', 'success');
            
            // Open WhatsApp after copying
            setTimeout(() => {
                if (isMobileDevice()) {
                    window.location.href = 'whatsapp://send';
                } else {
                    window.open('https://web.whatsapp.com/', '_blank');
                }
            }, 1500);
        } else {
            showMessage('Copy not supported. Please use Download instead.', 'error');
        }
    } catch (err) {
        console.error('Copy failed:', err);
        showMessage('Copy failed. Please use Download instead.', 'error');
    }
}

// Share QR Code using Web Share API
async function shareQRCode() {
    if (!qrImageBlob) {
        showMessage('No QR code to share', 'error');
        return;
    }
    
    // Check if Web Share API is available
    if (navigator.share) {
        try {
            const file = new File([qrImageBlob], `QR_${generatedPhoneNumber}.png`, { 
                type: 'image/png',
                lastModified: Date.now()
            });
            
            if (navigator.canShare && navigator.canShare({ files: [file] })) {
                await navigator.share({
                    files: [file],
                    title: 'Phone QR Code',
                    text: `QR Code for ${generatedPhoneNumber}`
                });
                showMessage('Shared successfully!', 'success');
            } else {
                // Can't share files, share text instead
                await navigator.share({
                    title: 'Phone QR Code',
                    text: `Call ${generatedPhoneNumber}`,
                    url: window.location.href
                });
            }
        } catch (err) {
            if (err.name !== 'AbortError') {
                console.error('Share failed:', err);
                downloadQRCode();
            }
        }
    } else {
        // No share API, download instead
        downloadQRCode();
    }
}

// Show message
function showMessage(text, type = 'info') {
    const messageEl = document.getElementById('message');
    messageEl.textContent = text;
    messageEl.className = `message ${type}`;
    messageEl.style.display = 'block';
    
    // Auto hide after 5 seconds
    setTimeout(() => {
        messageEl.style.display = 'none';
    }, 5000);
}

// Check if mobile device
function isMobileDevice() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) 
           || (navigator.maxTouchPoints && navigator.maxTouchPoints > 2);
}

// Export functions for onclick handlers
window.generateQRCode = generateQRCode;
window.sendToWhatsApp = sendToWhatsApp;
window.downloadQRCode = downloadQRCode;
window.copyToClipboard = copyToClipboard;
window.shareQRCode = shareQRCode;
