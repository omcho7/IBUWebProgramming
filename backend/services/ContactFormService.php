<?php
require_once __DIR__ . '/../dao/ContactFormDao.php';

class ContactFormService {
    private $contactFormDao;

    public function __construct() {
        $this->contactFormDao = new ContactFormDao();
    }

    public function submitContactForm($data) {
        // Validate required fields
        $requiredFields = ['fullName', 'email', 'topic', 'message'];
        foreach ($requiredFields as $field) {
            if (empty($data[$field])) {
                throw new Exception("Missing required field: $field");
            }
        }

        // Validate email format
        if (!filter_var($data['email'], FILTER_VALIDATE_EMAIL)) {
            throw new Exception("Invalid email format");
        }

        // Validate topic
        $validTopics = ['Consultation', 'Meal Plans', 'Support', 'Other'];
        if (!in_array($data['topic'], $validTopics)) {
            throw new Exception("Invalid topic selected");
        }

        try {
            $id = $this->contactFormDao->add($data);
            return [
                'success' => true,
                'message' => 'Contact form submitted successfully',
                'id' => $id
            ];
        } catch (PDOException $e) {
            error_log("Error in ContactFormService::submitContactForm: " . $e->getMessage());
            throw new Exception("Failed to submit contact form");
        }
    }

    public function getAllContactForms() {
        try {
            return $this->contactFormDao->getAll();
        } catch (PDOException $e) {
            error_log("Error in ContactFormService::getAllContactForms: " . $e->getMessage());
            throw new Exception("Failed to retrieve contact forms");
        }
    }

    public function getSubmissionById($id) {
        $submission = $this->contactFormDao->getById($id);
        if (!$submission) {
            throw new Exception("Contact form submission not found.");
        }
        return $submission;
    }

    public function deleteSubmission($id) {
        $submission = $this->contactFormDao->getById($id);
        if (!$submission) {
            throw new Exception("Contact form submission not found.");
        }
        return $this->contactFormDao->delete($id);
    }

    public function sendAcknowledgmentEmail($email) {
        // maybe implement PHPMailer or similar for sending emails
        mail($email, "Thank you for contacting us", "We have received your message and will get back to you soon.");
    }

    public function searchSubmissions($query) {
        $stmt = $this->connection->prepare("SELECT * FROM contactform WHERE topic LIKE :query OR email LIKE :query");
        $stmt->bindValue(':query', "%$query%");
        $stmt->execute();
        return $stmt->fetchAll();
    }
}
?>