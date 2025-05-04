<?php
require_once 'BaseService.php';
require_once 'backend\dao\ContactFormDao.php';

class ContactFormService extends BaseService {
    public function __construct() {
        parent::__construct(new ContactFormDao());
    }

    public function submitContactForm($data) {
        
        if (empty($data['fullName']) || empty($data['email']) || empty($data['topic']) || empty($data['message'])) {
            throw new Exception("Missing required fields: fullName, email, topic, or message.");
        }

        
        if (!filter_var($data['email'], FILTER_VALIDATE_EMAIL)) {
            throw new Exception("Invalid email format.");
        }

        
        $allowedTopics = ['Consultation', 'Meal Plans', 'Support', 'Other'];
        if (!in_array($data['topic'], $allowedTopics)) {
            throw new Exception("Invalid topic. Allowed topics are: " . implode(', ', $allowedTopics));
        }

        
        return $this->dao->insert($data);
    }

    public function getAllSubmissions() {
        return $this->dao->getAll();
    }

    public function getSubmissionById($id) {
        $submission = $this->dao->getById($id);
        if (!$submission) {
            throw new Exception("Contact form submission not found.");
        }
        return $submission;
    }

    public function deleteSubmission($id) {
        $submission = $this->dao->getById($id);
        if (!$submission) {
            throw new Exception("Contact form submission not found.");
        }
        return $this->dao->delete($id);
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