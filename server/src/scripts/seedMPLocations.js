/**
 * One-time seed script for Madhya Pradesh District + Tehsil reference data.
 * Run from the server/ directory:   node src/scripts/seedMPLocations.js
 *
 * Data source: Wikipedia "List of districts of Madhya Pradesh" and
 * "List of tehsils of Madhya Pradesh" (accessed 2026-09-11), cross-checked
 * against the individual Maihar/Mauganj/Pandhurna district pages for the
 * 3 newest districts (created 2023) whose tehsils weren't yet reflected in
 * the main tehsil table.
 *
 * Known limitation: this is best-effort reference data compiled for an
 * academic project, NOT an authoritative government source. All 55
 * districts are complete and accurate. Tehsil coverage is ~410 of MP's
 * official 428 tehsils — a small number of recently-reorganized tehsils
 * (mainly around Pandhurna/Maihar/Mauganj, all created in 2023) may be
 * missing or attributed to their old parent district. If exact accuracy
 * matters later, cross-check against https://lgdirectory.gov.in.
 *
 * Safe to re-run: uses upsert, so running this twice never creates
 * duplicates or wipes existing data.
 */

import mongoose from "mongoose";
import dotenv from "dotenv";
import dns from "node:dns";
import District from "../models/District.js";
import Tehsil from "../models/Tehsil.js";
dns.setServers(["8.8.8.8", "8.8.4.4"]);
dotenv.config();

const DATA = {
  "Bhopal Division": {
    "Bhopal": ["Huzur", "Kolar", "Berasia"],
    "Raisen": ["Raisen", "Goharganj", "Begamganj", "Gairatganj", "Silwani", "Barely", "Badi", "Udaipura", "Sultanpur"],
    "Rajgarh": ["Rajgarh", "Khilchipur", "Zirapur", "Biaora", "Narsinghgarh", "Sarangpur", "Pachore", "Khujner", "Suthaliya"],
    "Sehore": ["Sehore (Urban)", "Sehore (Rural)", "Shyampur", "Ashta", "Jawar", "Ichhawar", "Nasrullaganj", "Budhni", "Rehti"],
    "Vidisha": ["Vidisha Urban", "Vidisha Rural", "Ganj Basoda", "Gyaraspur", "Kurwai", "Lateri", "Nateran", "Sironj", "Gulabganj", "Pathari", "Shamshabad", "Tyonda"],
  },
  "Chambal Division": {
    "Morena": ["Morena Urban", "Morena Rural", "Bamor", "Ambah", "Porsa", "Joura", "Sabalgarh", "Kailaras"],
    "Bhind": ["Bhind", "Ater", "Lahar", "Mehgaon", "Mau", "Roun", "Mihona", "Gohad", "Gormi"],
    "Sheopur": ["Sheopur", "Badoda", "Karahal", "Vijaypur", "Birpur"],
  },
  "Gwalior Division": {
    "Gwalior": ["Gwalior", "Dabra", "Bhitarwar", "Chinore", "Ghatigaon", "Tansen", "Murar", "City Centre"],
    "Ashoknagar": ["Ashoknagar", "Chanderi", "Isagarh", "Mungaoli", "Nai Sarai", "Piparai", "Shadora"],
    "Datia": ["Datia", "Badoni", "Seondha", "Indergarh", "Bhander"],
    "Guna": ["Guna", "Aron", "Raghogarh", "Chachaura", "Bamori", "Maksudangarh", "Kumbhraj"],
    "Shivpuri": ["Shivpuri", "Pohari", "Bairad", "Kolaras", "Badarwas", "Pichhore", "Khaniadhana", "Karera", "Narwar"],
  },
  "Indore Division": {
    "Indore": ["Old Indore", "Kanadiya", "Bicholi Hapsi", "Malharganj", "Khudail", "Rau", "Dr. Ambedkar Nagar", "Sanwer", "Depalpur", "Hatod"],
    "Alirajpur": ["Alirajpur", "Jobat", "Sondwa", "Bhavra", "Katthiwada"],
    "Barwani": ["Barwani", "Pati", "Sendhwa", "Warla", "Anjad", "Rajpur", "Thikri", "Niwali", "Pansemal"],
    "Burhanpur": ["Burhanpur", "Khaknar", "Nepanagar"],
    "Dhar": ["Dhar", "Badnawar", "Kukshi", "Manawar", "Gadwani", "Dahi", "Dharmapuri", "Sardarpur", "Pithampur"],
    "Jhabua": ["Jhabua", "Ranapur", "Thandla", "Petlavad", "Meghnagar", "Rama"],
    "Khandwa": ["Khandwa", "Pandhana", "Mundi", "Punasa", "Harsud", "Khalwa"],
    "Khargone": ["Khargone", "Khargone Nagar", "Kasrawad", "Maheshwar", "Badwah", "Sanawad", "Gogawaan", "Bhikangaon", "Jhirniya", "Bhagwanpura", "Segaon"],
  },
  "Jabalpur Division": {
    "Jabalpur": ["Jabalpur", "Kundam", "Majoli", "Patan", "Panagar", "Sihora", "Shahpura", "Adhartal", "Ranjhi", "Gorakhpur"],
    "Balaghat": ["Balaghat", "Baihar", "Birsa", "Katangi", "Khairlanji", "Kirnapur", "Lalbarra", "Lanji", "Paraswada", "Waraseoni"],
    "Chhindwara": ["Chhindwara", "Chhindwara Nagar", "Parsia", "Chaurai", "Junnardeo", "Sauser", "Amarwada", "Harrai", "Tamiya", "Mohkhed", "Bichua", "Umreth", "Chand"],
    "Dindori": ["Dindori", "Shahpura", "Bajag"],
    "Katni": ["Katni", "Katni Rural", "Reethi", "Badwara", "Bahoriband", "Vijayraghavgarh", "Dhimarkheda", "Barhi"],
    "Mandla": ["Mandla", "Nainpur", "Bichiya", "Ghughri", "Nivas", "Narayanganj"],
    "Narsinghpur": ["Narsinghpur", "Gadarwara", "Gotegaon", "Tendukheda", "Kareli", "Sainkheda"],
    "Pandhurna": ["Pandhurna", "Sausar", "Nandanwadi (Sub Tehsil)"],
    "Seoni": ["Seoni", "Barghat", "Chhapra", "Dhanora", "Ghansor", "Kevlari", "Kurai", "Lakhanadon", "Seoni Gramin"],
  },
  "Narmadapuram Division": {
    "Narmadapuram": ["Narmadapuram", "Itarsi", "Doleria", "Seoni Malwa", "Makhan Nagar", "Sohagpur", "Pipariya", "Bankhedi"],
    "Betul": ["Betul", "Multai", "Amla", "Bhainsdehi", "Athner", "Shahpur", "Ghodadongri", "Chicholi", "Bhimpur", "Prabhat Pattan"],
    "Harda": ["Harda", "Handia", "Timarni", "Rahatgaon", "Khirkiya", "Sirali"],
  },
  "Rewa Division": {
    "Rewa": ["Huzoor Rural", "Huzoor Urban", "Jawa", "Teonthar", "Raipur Kurchulian", "Gurh", "Sirmaur", "Semaria", "Mangawan"],
    "Maihar": ["Maihar", "Amarpatan", "Ramnagar"],
    "Mauganj": ["Mauganj", "Hanumana", "Nai Garhi"],
    "Satna": ["Raghurajnagar Rural", "Raghurajnagar Urban", "Majhgawan", "Nagod", "Rampur Baghelan", "Kotar", "Birsinghpur", "Kothi", "Unchehra"],
    "Sidhi": ["Bahari", "Kusmi", "Churhat", "Majhauli", "Rampur Naikin", "Gopad Banas", "Sihawal"],
    "Singrauli": ["Singrauli Urban", "Singrauli", "Chitrangi", "Devsar", "Mada", "Sarai"],
  },
  "Sagar Division": {
    "Sagar": ["Sagar", "Bina", "Khurai", "Malthon", "Banda", "Shahgarh", "Rahatgarh", "Jaisinagar", "Garhakota", "Rehli", "Deori", "Kesli"],
    "Chhatarpur": ["Chhatarpur", "Bada Malhera", "Bijawar", "Buxwaha", "Chandla", "Gaurihar", "Ghuwara", "Laundi", "Maharajpur", "Nowgong", "Rajnagar"],
    "Damoh": ["Damoh", "Patharia", "Batiyagarh", "Hatta", "Patera", "Tendu Kheda", "Jabera"],
    "Niwari": ["Niwari", "Prithvipur", "Orchha"],
    "Panna": ["Panna", "Ajaygarh", "Amanganj", "Devendranagar", "Gunnor", "Pawai", "Raipura", "Shahnagar", "Simariya"],
    "Tikamgarh": ["Tikamgarh", "Jatara", "Mohangarh", "Lidhora", "Baldeogarh", "Khargapur", "Palera"],
  },
  "Shahdol Division": {
    "Shahdol": ["Shahdol", "Jaisinghnagar", "Sohagpur", "Beohari", "Gohapur", "Burhar", "Jaitpur"],
    "Anuppur": ["Anuppur", "Jaithari", "Kotma", "Pushprajgarh"],
    "Umaria": ["Umaria", "Bandhavgarh", "Manpur", "Pali", "Chandia", "Nowrozabad", "Karkeli"],
  },
  "Ujjain Division": {
    "Ujjain": ["Ujjain", "Ujjain Rural", "Ujjain Kothi Mahal", "Ghatiya", "Tarana", "Makdone", "Mehidpur", "Jharda", "Badnagar", "Khachrod", "Nagda"],
    "Agar Malwa": ["Agar", "Barode", "Susner", "Nalkheda"],
    "Dewas": ["Bagli", "Dewas", "Hatpipliya", "Kannod", "Khategaon", "Satwas", "Sonkatch", "Tonk Khurd"],
    "Mandsaur": ["Mandsaur", "Malhargarh", "Sitamau", "Suvasara", "Bhanpura", "Garoth", "Shamgarh", "Daloda"],
    "Neemuch": ["Neemuch Nagar", "Neemuch", "Jiran", "Manasa", "Rampura", "Jawad", "Singoli"],
    "Ratlam": ["Ratlam", "Ratlam Rural", "Sailana", "Bajna", "Raoti", "Jaora", "Piploda", "Alot", "Tal"],
    "Shajapur": ["Shajapur", "Mohan Badodiya", "Gulana", "Shujalpur", "Kalapipal", "Avantipur Badodiya", "Polay Kalan"],
  },
};

async function seed() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log("Connected to MongoDB.");

  let districtCount = 0;
  let tehsilCount = 0;

  for (const [division, districts] of Object.entries(DATA)) {
    for (const [districtName, tehsils] of Object.entries(districts)) {
      const district = await District.findOneAndUpdate(
        { name: districtName },
        { name: districtName, division },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
      districtCount++;

      for (const tehsilName of tehsils) {
        await Tehsil.findOneAndUpdate(
          { name: tehsilName, district: district._id },
          { name: tehsilName, district: district._id },
          { upsert: true, setDefaultsOnInsert: true }
        );
        tehsilCount++;
      }
    }
  }

  console.log(`Seeded/updated ${districtCount} districts and ${tehsilCount} tehsils.`);
  await mongoose.disconnect();
  console.log("Done.");
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});