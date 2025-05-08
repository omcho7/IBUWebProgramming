<?php
require_once 'BaseService.php';
require_once 'backend\dao\AppointmentsDao.php';

class AppointmentsService extends BaseService {
    public function __construct() {
        parent::__construct(new AppointmentsDao());
    }

    public function getAppointmentsByUserId($userId) {
        return $this->dao->getByUserId($userId);
    }

    public function createAppointment($data) {
        if (empty($data['user_id']) || empty($data['nutritionist_id']) || empty($data['date']) || empty($data['time'])) {
            throw new Exception("Missing required fields: user_id, nutritionist_id, date, or time.");
        }

        $data['status'] = 'Pending';
        return $this->dao->insert($data);
    }

    public function updateAppointmentStatus($id, $status) {
        if (!in_array($status, ['Pending', 'Confirmed', 'Denied'])) {
            throw new Exception("Invalid status. Allowed values are: Pending, Confirmed, Denied.");
        }

        $appointment = $this->dao->getById($id);
        if (!$appointment) {
            throw new Exception("Appointment not found.");
        }

        return $this->dao->update($id, ['status' => $status]);
    }

    public function checkAppointmentConflict($userId, $date, $time) {
        $appointments = $this->dao->getByUserId($userId);
        foreach ($appointments as $appointment) {
            if ($appointment['date'] === $date && $appointment['time'] === $time) {
                throw new Exception("Appointment conflict detected.");
            }
        }
    }

    public function cancelAppointment($id) {
        $appointment = $this->dao->getById($id);
        if (!$appointment) {
            throw new Exception("Appointment not found.");
        }
        return $this->dao->update($id, ['status' => 'Cancelled']);
    }
}
?>