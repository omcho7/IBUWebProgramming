<?php
require_once 'BaseService.php';
require_once 'backend\dao\AppointmentsDao.php';

class AppointmentsService extends BaseService {
    private $appointmentsDao;

    public function __construct() {
        parent::__construct();
        $this->appointmentsDao = new AppointmentsDao();
        $this->dao = $this->appointmentsDao; // Set the base DAO as well
    }

    public function getAppointmentsByUserId($userId) {
        return $this->appointmentsDao->getByUserId($userId);
    }

    public function createAppointment($data) {
        if (empty($data['user_id']) || empty($data['nutritionist_id']) || empty($data['date']) || empty($data['time'])) {
            throw new Exception("Missing required fields: user_id, nutritionist_id, date, or time.");
        }

        $data['status'] = 'Pending';
        return $this->appointmentsDao->insert($data);
    }

    public function updateAppointmentStatus($id, $status) {
        if (!in_array($status, ['Pending', 'Confirmed', 'Denied'])) {
            throw new Exception("Invalid status. Allowed values are: Pending, Confirmed, Denied.");
        }

        $appointment = $this->appointmentsDao->getById($id);
        if (!$appointment) {
            throw new Exception("Appointment not found.");
        }

        return $this->appointmentsDao->update($id, ['status' => $status]);
    }

    public function checkAppointmentConflict($userId, $date, $time) {
        $appointments = $this->appointmentsDao->getByUserId($userId);
        foreach ($appointments as $appointment) {
            if ($appointment['date'] === $date && $appointment['time'] === $time) {
                throw new Exception("Appointment conflict detected.");
            }
        }
    }

    public function cancelAppointment($id) {
        $appointment = $this->appointmentsDao->getById($id);
        if (!$appointment) {
            throw new Exception("Appointment not found.");
        }
        return $this->appointmentsDao->update($id, ['status' => 'Cancelled']);
    }

    public function getAllAppointments() {
        try {
            $query = "SELECT a.*, u.username 
                     FROM appointments a 
                     LEFT JOIN users u ON a.user_id = u.id 
                     ORDER BY a.date DESC, a.time DESC";
            return $this->appointmentsDao->query($query);
        } catch (Exception $e) {
            error_log("Error in getAllAppointments: " . $e->getMessage());
            throw $e;
        }
    }

    public function deleteAppointment($id) {
        $appointment = $this->appointmentsDao->getById($id);
        if (!$appointment) {
            throw new Exception("Appointment not found.");
        }
        return $this->appointmentsDao->delete($id);
    }
}
?>