// controllers/memberController.js
import { deleteFromCloudinary, uploadOnCloudinary } from "../utils/cloudinary.js";
import { Member } from "../models/member.model.js";


// Add a new member
const addMember = async (req, res) => {

    const {name,domain,linkedlnIdId} = req.body

    const existingMember = await Member.findOne({ linkedlnIdId });
    if (existingMember) {
        return res.status(201).json({ message: "LinkedIn ID already exists" });
    }

    const profileImageLocalpath = req.files?.profileImage?.[0].path;
    
    if( !(profileImageLocalpath) )
        {
          res.status(500).json({ message: error.message });
        }

    //upload them on cloudinary
    const profileImage = await uploadOnCloudinary(profileImageLocalpath);

    
        if(!profileImage){
            res.status(500).json({ message:"image not uploaded successfully"});
        }
        console.log(profileImage.url)

    const member = await Member.create({
        name,
        profileImage: profileImage.url,
        domain,
        linkedlnIdId,
    })

    const memberUploaded = await Member.findById(member._id);

    if (!memberUploaded) {
        res.status(202).json({ message: "upload failed please try again !!!" });
    }

    return res
        .status(200)
        .json({ message: "uploaded successfully" });
  };

// Fetch all members
const getAllMembers = async (req, res) => {
  try {
    const members = await Member.find();
    res.status(200).json(members);
  } catch (error) {
    res.status(201).json({ message: "Server error occured" });
  }
};

// Fetch a particular member by ID
const getMemberById = async (req, res) => {
  try {
    const member = await Member.findById(req.params.id);
    if (!member) {
      return res.status(201).json({ message: 'Member not found' });
    }
    res.status(200).json(member);
  } catch (error) {
    res.status(201).json({ message: error.message });
  }
};

const getAllMemberss = async (req, res) => {
    try {
      const members = await Member.find().sort({ p: -1 });
      res.status(200).json(members);
    } catch (error) {
      res.status(201).json({ message: error.message });
    }
  };
export {
addMember,
getAllMembers,getMemberById,getAllMemberss
}
