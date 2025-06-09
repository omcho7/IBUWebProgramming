<?php
require_once 'BaseService.php';
require_once 'backend\dao\AppointmentsDao.php';
require_once 'backend\dao\UserDao.php';

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
        try {
            if (empty($data['user_id']) || empty($data['nutritionist_id']) || empty($data['date']) || empty($data['time'])) {
                throw new Exception("Missing required fields: user_id, nutritionist_id, date, or time.");
            }

            // Verify that the user exists
            $userDao = new UserDao();
            $user = $userDao->getById($data['user_id']);
            if (!$user) {
                throw new Exception("User with ID {$data['user_id']} does not exist.");
            }

            // Verify that the nutritionist exists
            $nutritionist = $userDao->getById($data['nutritionist_id']);
            if (!$nutritionist) {
                throw new Exception("Nutritionist with ID {$data['nutritionist_id']} does not exist.");
            }

            $data['status'] = 'Pending';
            return $this->appointmentsDao->add($data);
        } catch (PDOException $e) {
            error_log("Error creating appointment: " . $e->getMessage());
            throw new Exception("Failed to create appointment: " . $e->getMessage());
        }
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