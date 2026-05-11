document.addEventListener('DOMContentLoaded', () => {
    // Replace with your actual EmailJS Public Key
    emailjs.init({
      publicKey: "rllmTGcSGAqEEfiee",
    });

    const emailBtn = document.getElementById('openEmailModal');
    const queryModal = document.getElementById('queryModal');
    const closeQueryModal = document.getElementById('closeQueryModal');
    const queryForm = document.getElementById('queryForm');
    const submitBtn = document.getElementById('submitQueryBtn');
    const queryStatus = document.getElementById('queryStatus');

    // Open Modal
    emailBtn.addEventListener('click', () => {
        queryModal.classList.remove('hidden');
        queryStatus.classList.add('hidden');
        queryForm.reset();
    });

    // Close Modal
    closeQueryModal.addEventListener('click', () => {
        queryModal.classList.add('hidden');
    });

    // Handle Form Submission
    queryForm.addEventListener('submit', function(e) {
        e.preventDefault();

        // Change button state
        submitBtn.disabled = true;
        submitBtn.textContent = 'Sending...';
        queryStatus.classList.add('hidden');

        // Gather data
        const templateParams = {
            heading: document.getElementById('queryHeading').value,
            query: document.getElementById('queryText').value,
            client_email: document.getElementById('queryEmail').value,
            client_name: document.getElementById('queryName').value || 'Not provided',
            client_mobile: document.getElementById('queryMobile').value || 'Not provided',
            client_place: document.getElementById('queryPlace').value || 'Not provided'
        };

        // Send Email
        // Replace with your actual Service ID and Template ID
        emailjs.send('service_JAAS', 'template_nl0pxhf', templateParams)
            .then(function() {
                queryStatus.textContent = 'Query sent successfully! We will get back to you soon.';
                queryStatus.style.color = 'var(--clr-success)';
                queryStatus.classList.remove('hidden');
                submitBtn.disabled = false;
                submitBtn.textContent = 'Send Query';
                queryForm.reset();
                
                // Close modal after 3 seconds on success
                setTimeout(() => {
                    queryModal.classList.add('hidden');
                }, 3000);
            }, function(error) {
                console.error('FAILED...', error);
                queryStatus.textContent = 'Failed to send query. Please try again later or use WhatsApp.';
                queryStatus.style.color = 'var(--clr-danger)';
                queryStatus.classList.remove('hidden');
                submitBtn.disabled = false;
                submitBtn.textContent = 'Send Query';
            });
    });
});
