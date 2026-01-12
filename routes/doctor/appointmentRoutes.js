import express from "express";
import { bookAppointment, cancelAppointment, getDoctorSlots, getMyAppointments } from "../../controller/doctor/appointmentController.js";
import { auth } from "../../middleware/auth.js";

const router = express.Router();

router.post("/",auth, bookAppointment);
router.get("/me",auth,getMyAppointments);
router.get("/:doctorId/slots",auth,getDoctorSlots);
router.get("/:id/cancel",auth,cancelAppointment);

export default router;
