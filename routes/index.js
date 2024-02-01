const express = require("express");
const createError = require("http-errors");
const {
  getUsers,
  Register,
  Login,
  Logout,
  Update,
  Delete,
  CreateUser,
  UpdateUserGallery,
  getUsersGallery,
  getSpesificUsersGallery,
  getDataGender,
} = require("../controllers/Users.js");

const { uploadSingle, uploadMultiple } = require("../middleware/multer.js");
const verifyToken = require("../middleware/VerifyToken.js");
const RefreshToken = require("../controllers/RefreshToken.js");

const router = express.Router();

router.get("/users", verifyToken, getUsers);
router.get("/users_gallery", verifyToken, getUsersGallery);
router.get("/data_gender", verifyToken, getDataGender);
router.post("/get_user_gallery", verifyToken, getSpesificUsersGallery);
router.post("/delete_user", verifyToken, Delete);
router.post("/update_user", verifyToken, uploadSingle, Update);
router.post("/create_user", uploadSingle, CreateUser);
router.post("/create_user_gallery", uploadMultiple, UpdateUserGallery);
router.post("/register", Register);
router.post("/login", Login);
router.post("/logout", Logout);

module.exports = router;
