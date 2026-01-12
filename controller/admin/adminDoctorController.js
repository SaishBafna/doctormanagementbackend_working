import Doctor from "../../models/Doctor.js";

// @desc Create new doctor
export const createDoctor = async (req, res) => {
  try {
    const doctor = new Doctor(req.body);
    await doctor.save();
    res.status(201).json({ message: "Doctor created successfully", doctor });
  } catch (err) {
    res.status(400).json({ message: "Invalid data", error: err.message });
  }
};
export const toggleDoctorStatus = async (req, res) => {
  try {
    const doctor = await Doctor.findById(req.params.id);

    if (!doctor) {
      return res.status(404).json({ message: "Doctor not found" });
    }

    doctor.status = doctor.status === "Active" ? "Inactive" : "Active";
    await doctor.save();

    res.json({
      success: true,
      message: `Doctor ${doctor.status}`,
      status: doctor.status,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
export const getActiveDoctors = async (req, res) => {
  try {
    const doctors = await Doctor.find({ status: "Active" })
      .sort({ rating: -1 });

    res.json({
      success: true,
      total: doctors.length,
      data: doctors,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};


// @desc Get all doctors
// export const getDoctors = async (req, res) => {
//   try {
//     const doctors = await Doctor.find().populate("userId", "name email role");
//     res.json(doctors);
//   } catch (err) {
//     res.status(500).json({ message: "Server error", error: err.message });
//   }
// };

// export const getDoctors = async (req, res) => {
//   try {
//     const { page = 1, limit = 10 } = req.query;

//     const skip = (Number(page) - 1) * Number(limit);

//     const [doctors, total] = await Promise.all([
//       Doctor.find()
//         // .populate("userId", "name email role")
//         .skip(skip)
//         .limit(Number(limit)),
//       Doctor.countDocuments()
//     ]);

//     res.json({
//       page: Number(page),
//       limit: Number(limit),
//       totalItems: total,
//       totalPages: Math.ceil(total / limit),
//       items: doctors,
//     });
//   } catch (err) {
//     res.status(500).json({ message: "Server error", error: err.message });
//   }
// };

export const getDoctors = async (req, res) => {
  try {
    const { search = "", page = 1, limit = 10 } = req.query;

    const skip = (Number(page) - 1) * Number(limit);

    // 🔹 Build search query
    let query = {};
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { specialty: { $regex: search, $options: "i" } },
        { location: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ];
    }

    // 🔹 Fetch paginated results
    const [doctors, totalFiltered] = await Promise.all([
      Doctor.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      Doctor.countDocuments(query),
    ]);

    // 🔹 Summary stats (global — not affected by search)
    const [totalDoctors, activeDoctors, specialities, avgRatingData] = await Promise.all([
      Doctor.countDocuments(),
      Doctor.countDocuments({ status: "Active" }),
      (await Doctor.distinct("specialty")).length,
      Doctor.aggregate([
        {
          $group: {
            _id: null,
            avgRating: { $avg: "$rating" },
          },
        },
      ]),
    ]);

    const avgRating =
      avgRatingData.length > 0 && avgRatingData[0].avgRating
        ? Number(avgRatingData[0].avgRating.toFixed(2))
        : 0;

    // 🔹 Response
    res.json({
      summary: {
        totalDoctors,
        activeDoctors,
        specialities,
        avgRating,
      },
      filteredCount: totalFiltered,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(totalFiltered / limit),
      items: doctors,
    });
  } catch (err) {
    console.error("❌ getDoctors Error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};



// @desc Get single doctor by ID
export const getDoctorById = async (req, res) => {
  try {
    const doctor = await Doctor.findById(req.params.id).populate("userId", "name email role");
    if (!doctor) return res.status(404).json({ message: "Doctor not found" });
    res.json(doctor);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// @desc Update doctor
export const updateDoctor = async (req, res) => {
  try {
    const doctor = await Doctor.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!doctor) return res.status(404).json({ message: "Doctor not found" });
    res.json({ message: "Doctor updated successfully", doctor });
  } catch (err) {
    res.status(400).json({ message: "Invalid data", error: err.message });
  }
};

// @desc Delete doctor
export const deleteDoctor = async (req, res) => {
  try {
    const doctor = await Doctor.findByIdAndDelete(req.params.id);
    if (!doctor) return res.status(404).json({ message: "Doctor not found" });
    res.json({ message: "Doctor deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};