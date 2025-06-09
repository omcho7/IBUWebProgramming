// Configure toastr
toastr.options = {
    "closeButton": true,
    "progressBar": true,
    "positionClass": "toast-top-right",
    "timeOut": "3000"
};

function handleContactSubmit() {
    const fullName = document.getElementById('fullName').value;
    const email = document.getElementById('email').value;
    const topic = document.getElementById('topic').value;
    const message = document.getElementById('message').value;

    if (!fullName || !email || !topic || !message) {
        toastr.error('Please fill in all fields');
        return;
    }

    const data = {
        fullName: fullName,
        email: email,
        topic: topic,
        message: message
    };

    console.log('Sending data:', data);

    fetch('/OmarOsmanovic/IBUWebProgramming/backend/contact-form', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        },
        body: JSON.stringify(data)
    })
    .then(response => {
        console.log('Response received:', response);
        if (!response.ok) {
            return response.json().then(err => Promise.reject(err));
        }
        return response.json();
    })
    .then(result => {
        console.log('Success response:', result);
        if (result.success) {
            toastr.success('Message sent successfully! We will get back to you soon.');
            document.getElementById('contactForm').reset();
        } else {
            throw new Error(result.error || 'Failed to send message');
        }
    })
    .catch(error => {
        console.error('Error submitting contact form:', error);
        toastr.error(error.error || error.message || 'Failed to send message. Please try again.');
    });
} 