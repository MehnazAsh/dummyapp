// Global variables
let currentQRCode = null;
let qrCodeDataURL = null;
let generatedPhoneNumber = null;

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    initializeEventListeners();
});

// Initialize all event listeners
function initializeEventListeners() {
    // Format phone number as user types
    const phoneInput = document.getElementById('phoneNumber');
    phoneInput.addEventListener('input', function(e) {
        // Remove non-numeric characters
        this.value = this.value.replace(/\D/g, '');
    });

    // Allow Enter key to generate QR code
    phoneInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            generateQRCode();
        }
    });

    // Close modal when clicking outside
    window.onclick = function(event) {
        const modal = document.getElementById('instructionsModal');
        if (event.target == modal) {
            closeModal();
        }
    }
}

// Generate QR Code function
function generateQRCode() {
    const countryCode = document.getElementById('countryCode').value;
    const phoneNumber = document.getElementById('phoneNumber').value.trim();
    const errorMessage = document.getElementById('errorMessage');
    const successMessage = document.getElementById('successMessage');
    const loading = document.getElementById('loading');
    const placeholder = document.querySelector('.placeholder');
    
    // Hide messages
    hideMessages();
    
    // Validate phone number
    if (!validatePhoneNumber(phoneNumber)) {
        showError('Please enter a valid phone number');
        return;
    }
    
    // Store the generated phone number
    generatedPhoneNumber = countryCode + phoneNumber;
    
    // Show loading
    placeholder.style.display = 'none';
    loading.style.display = 'block';
    
    // Clear previous QR code
    const qrContainer = document.getElementById('qrcode');
    qrContainer.innerHTML = '';
    
    // Simulate loading delay for better UX
    setTimeout(() => {
        const qrData = `tel:${generatedPhoneNumber}`;
        
        try {
            // Create QR code
            currentQRCode = new QRCode(qrContainer, {
                text: qrData,
                width: 200,
                height: 200,
                colorDark: "#000000",
                colorLight: "#ffffff",
                correctLevel: QRCode.CorrectLevel.H
            });
            
            // Generate high quality image
            setTimeout(() => {
                generateHighQualityImage(qrData);
            }, 100);
            
            // Hide loading
            loading.style.display = 'none';
            
            // Add styling to container
            document.getElementById('qrContainer').classList.add('has-qr');
            
            // Enable WhatsApp button
            enableWhatsAppButton();
            
            // Show success message
            showSuccess('QR Code generated successfully!');
            
        } catch (error) {
            console.error('Error generating QR code:', error);
            loading.style.display = 'none';
            placeholder.style.display = 'block';
            showError('Failed to generate QR code. Please try again.');
        }
    }, 500);
}

// Generate high quality image for download
function generateHighQualityImage(qrData) {
    const canvas = document.getElementById('hiddenCanvas');
    const size = 400; // Higher resolution for better quality
    
    // Create new QR code with higher resolution
    const tempDiv = document.createElement('div');
    tempDiv.style.display = 'none';
    document.body.appendChild(tempDiv);
    
    new QRCode(tempDiv, {
        text: qrData,
        width: size,
        height: size,
        colorDark: "#000000",
        colorLight: "#ffffff",
        correctLevel: QRCode.CorrectLevel.H
    });
    
    setTimeout(() => {
        const tempCanvas = tempDiv.querySelector('canvas');
        if (tempCanvas) {
            // Copy to hidden canvas
            canvas.width = size + 40; // Add padding
            canvas.height = size + 80; // Add padding for text
            const ctx = canvas.getContext('2d');
            
            // White background
            ctx.fillStyle = 'white';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            
            // Draw QR code
            ctx.drawImage(tempCanvas, 20, 20);
            
            // Add phone number text
            ctx.fillStyle = '#333';
            ctx.font = 'bold 16px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(`Phone: ${generatedPhoneNumber}`, canvas.width / 2, size + 50);
            
            // Store data URL
            qrCodeDataURL = canvas.toDataURL('image/png');
        }
        document.body.removeChild(tempDiv);
    }, 100);
}

// Send to WhatsApp function
function sendToWhatsApp() {
    const phoneNumber = document.getElementById('phoneNumber').value.trim();
    
    if (!phoneNumber || !currentQRCode) {
        showError('Please generate a QR code first');
        return;
    }
    
    // First download the QR code
    downloadQRCode();
    
    // Show instructions modal
    showModal();
}

// Open WhatsApp
function openWhatsApp() {
    const message = `QR Code for phone number: ${generatedPhoneNumber}\n\nPlease find the QR code image attached.`;
    const encodedMessage = encodeURIComponent(message);
    
    // Detect device type and open WhatsApp accordingly
    if (isMobileDevice()) {
        // For mobile devices
        window.location.href = `whatsapp://send?text=${encodedMessage}`;
    } else {
        // For desktop - opens WhatsApp Web
        window.open(`https://web.whatsapp.com/send?text=${encodedMessage}`, '_blank');
    }
    
    // Close modal after a delay
    setTimeout(() => {
        closeModal();
    }, 1000);
}

// Download QR Code
function downloadQRCode() {
    if (qrCodeDataURL) {
        const link = document.createElement('a');
        const timestamp = new Date().getTime();
        link.download = `QR_${generatedPhoneNumber}_${timestamp}.png`;
        link.href = qrCodeDataURL;
        link.click();
        
        return true;
    }
    return false;
}

// Download only function (from modal)
function downloadOnly() {
    if (downloadQRCode()) {
        showSuccess('QR Code downloaded successfully!');
        setTimeout(() => {
            closeModal();
        }, 1000);
    }
}

// Modal functions
function showModal() {
    document.getElementById('instructionsModal').style.display = 'block';
}

function closeModal() {
    document.getElementById('instructionsModal').style.display = 'none';
}

// Helper Functions
function validatePhoneNumber(phoneNumber) {
    return phoneNumber && phoneNumber.length >= 7 && phoneNumber.length <= 15;
}

function hideMessages() {
    document.getElementById('errorMessage').style.display = 'none';
    document.getElementById('successMessage').style.display = 'none';
}

function showError(message) {
    const errorElement = document.getElementById('errorMessage');
    errorElement.textContent = '❌ ' + message;
    errorElement.style.display = 'block';
    setTimeout(() => {
        errorElement.style.display = 'none';
    }, 3000);
}

function showSuccess(message) {
    const successElement = document.getElementById('successMessage');
    successElement.textContent = '✅ ' + message;
    successElement.style.display = 'block';
    setTimeout(() => {
        successElement.style.display = 'none';
    }, 3000);
}

function enableWhatsAppButton() {
    const whatsappBtn = document.getElementById('whatsappBtn');
    whatsappBtn.disabled = false;
    whatsappBtn.classList.add('active');
}

function isMobileDevice() {
    return /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
}

// Clear QR Code
function clearQRCode() {
    const qrContainer = document.getElementById('qrcode');
    qrContainer.innerHTML = '';
    document.getElementById('qrContainer').classList.remove('has-qr');
    
    const whatsappBtn = document.getElementById('whatsappBtn');
    whatsappBtn.disabled = true;
    whatsappBtn.classList.remove('active');
    
    const placeholder = document.querySelector('.placeholder');
    placeholder.style.display = 'block';
    
    currentQRCode = null;
    qrCodeDataURL = null;
    generatedPhoneNumber = null;
}

// Export functions for global access (used by onclick attributes)
window.generateQRCode = generateQRCode;
window.sendToWhatsApp = sendToWhatsApp;
window.openWhatsApp = openWhatsApp;
window.downloadOnly = downloadOnly;
window.closeModal = closeModal;
