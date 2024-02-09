const { Users, UsersGallery } = require("../models/UserModel.js");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { Sequelize } = require("sequelize");
const XLSX = require("xlsx");

const getUsersGallery = async (req, res) => {
  try {
    const users = await Users.findAll({
      include: [
        {
          model: UsersGallery,
          attributes: ["user_id", "image_file"],
          required: true,
        },
      ],
      attributes: ["id", "name"],
    });
    res.json(users);
  } catch (error) {
    res.json({ code: 401, msg: "Error!" + JSON.stringify(error) });
  }
};
const getSpesificUsersGallery = async (req, res) => {
  try {
    const usersGallery = await UsersGallery.findAll({
      include: [
        {
          model: Users,
          attributes: ["id", "name", "email"],
          required: true,
        },
      ],
      where: {
        user_id: req.body.user_id,
      },
      attributes: ["id", "user_id", "image_file"],
    });
    res.json(usersGallery);
  } catch (error) {
    res.json({ msg: "Error!" + JSON.stringify(error) });
  }
};
const getUsers = async (req, res) => {
  try {
    const users = await Users.findAll({
      attributes: ["id", "name", "email", "gender", "image"],
    });
    res.json(users);
  } catch (error) {
    res.json({ msg: "Error!" + JSON.stringify(error) });
  }
};
const getDataChart = async (req, res) => {
  try {
    const genderCounts = await Users.findAll({
      attributes: [
        [Sequelize.fn("COUNT", Sequelize.col("gender")), "count"],
        [Sequelize.literal("IF(gender = 1, 'Male', 'Female')"), "name"],
      ],
      group: ["gender"],
    });
    const userActiveCount = await Users.findAll({
      attributes: [
        [Sequelize.fn("COUNT", Sequelize.col("is_active")), "count"],
        [
          Sequelize.literal("IF(is_active = 1, 'Active', 'Not Active')"),
          "name",
        ],
      ],
      group: ["is_active"],
    });

    res.json({ code: 200, genderCounts, userActiveCount });
  } catch (error) {
    console.log(error);
    res.json({ msg: "Error!" + JSON.stringify(error) });
  }
};
const getDownloadExcel = async (req, res) => {
  try {
    const users = await Users.findAll({
      attributes: ["id", "name", "email", 'is_active'],
    });
   
    const dataAsArrayOfArrays = users.map((item) => {
      return [item.name, item.email, item.is_active == 1 ? 'Active' : 'Not Active'];
    });
    const header = ["Name", "Email", "Active"];
    const completeData = [header, ...dataAsArrayOfArrays];
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.aoa_to_sheet(completeData);
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1');
    const excelBuffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
    // Set response headers
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=SampleData.xlsx');
  
    // Send the Excel file as a response
    res.send(excelBuffer);
  } catch (error) {
    console.log(error);
    res.json({ msg: "Error!" + JSON.stringify(error) });
  }
};

const CreateUser = async (req, res) => {
  const { name, email, gender } = req.body;

  const passwordDefault = process.env.PASSWORD;
  const salt = await bcrypt.genSalt();
  const hashPassword = await bcrypt.hash(passwordDefault, salt);
  try {
    await Users.create({
      name: name,
      email: email,
      password: hashPassword,
      gender: gender,
      image: `images/${req.file.filename}`,
    });
    res.json({ msg: "Register Berhasil", code: 200 });
  } catch (error) {
    console.log(error);
    res.json({ msg: "error!", code: 400 });
  }
};

const UpdateUserGallery = async (req, res) => {
  const { user_id } = req.body;
  console.log({ user_id });
  const files = req.files;
  try {
    if (files.length > 0) {
      await UsersGallery.destroy({
        where: {
          user_id: user_id,
        },
      });
      
      for (let i = 0; i < files.length; i++) {
        await UsersGallery.create({
          user_id: user_id,
          image_file: `images/${files[i].filename}`,
        });
      }
    }

    res.json({ msg: "Register Berhasil", code: 200 });
  } catch (error) {
    console.log(error);
    res.json({ msg: "error!", code: 400 });
  }
};

const Register = async (req, res) => {
  const { name, email, password, confPassword } = req.body;

  if (password !== confPassword)
    return res.json({
      msg: "Password dan Confirm Password tidak cocok",
      code: 400,
    });
  const salt = await bcrypt.genSalt();
  const hashPassword = await bcrypt.hash(password, salt);
  try {
    await Users.create({
      name: name,
      email: email,
      password: hashPassword,
    });
    res.json({ msg: "Register Berhasil", code: 200 });
  } catch (error) {
    console.log(error);
    res.json({ msg: "error!", code: 400 });
  }
};

const Login = async (req, res) => {
  try {
    const user = await Users.findAll({
      where: {
        email: req.body.email,
      },
    });
    const match = await bcrypt.compare(req.body.password, user[0].password);
    if (!match) return res.json({ msg: "Wrong Password", code: 400 });
    const userId = user[0].id;
    const name = user[0].name;
    const email = user[0].email;
    const accessToken = jwt.sign(
      { userId, name, email },
      process.env.ACCESS_TOKEN_SECRET,
      {
        expiresIn: "1h",
      }
    );
    const refreshToken = jwt.sign({ email }, process.env.REFRESH_TOKEN_SECRET, {
      expiresIn: "1h",
    });
    await Users.update(
      { refresh_token: refreshToken },
      {
        where: {
          id: userId,
        },
      }
    );
    // res.cookie("refreshToken", refreshToken, {
    //   httpOnly: true,
    //   maxAge: 24 * 60 * 60 * 1000,
    // });
    res.json({ accessToken, refreshToken, name, code: 200 });
  } catch (error) {
    res.json({ msg: "Email tidak ditemukan", code: 400 });
  }
};

const Logout = async (req, res) => {
  const refreshToken = req.body.refreshToken;
  if (!refreshToken) return res.sendStatus(204);
  const user = await Users.findAll({
    where: {
      refresh_token: refreshToken,
    },
  });
  if (!user[0]) return res.sendStatus(204);
  const userId = user[0].id;
  await Users.update(
    { refresh_token: null },
    {
      where: {
        id: userId,
      },
    }
  );
  res.json({ msg: "Berhasil", code: 200 });
};

const Delete = async (req, res) => {
  const { id } = req.body;
  console.log(id);
  if (id == null) {
    res.json({ msg: "error1!", code: 204 });
  }
  try {
    await Users.destroy({
      where: {
        id: id,
      },
    });
    res.json({ msg: "Delete Successfully", code: 200 });
  } catch (error) {
    console.log(error);
    res.json({ msg: "error!", code: 400 });
  }
};

const Update = async (req, res) => {
  console.log("test");
  const { id, name, email, gender } = req.body;
  if (!id) {
    res.json({ msg: "User not found!" });
  }
  try {
    console.log(req.file);
    if (req.file) {
      await Users.update(
        {
          name: name,
          email: email,
          gender: gender,
          image: `images/${req.file.filename}`,
        },
        {
          where: {
            id: id,
          },
        }
      );
    } else {
      await Users.update(
        {
          name: name,
          email: email,
          gender: gender,
        },
        {
          where: {
            id: id,
          },
        }
      );
    }
    res.json({ msg: "Register Berhasil", code: 200 });
  } catch (error) {
    res.json({ msg: "error!" + error, code: 400 });
  }
};
module.exports = {
  getUsersGallery,
  getSpesificUsersGallery,
  getDataChart,
  getDownloadExcel,
  UpdateUserGallery,
  getUsers,
  Register,
  CreateUser,
  Login,
  Logout,
  Delete,
  Update,
};
