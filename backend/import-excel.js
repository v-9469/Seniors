const mongoose = require('mongoose');
const xlsx = require('xlsx');
const crypto = require('crypto');
const path = require('path');
const User = require('./models/User');

// Configure these variables based on your Excel file
const EXCEL_FILE_PATH = path.join(__dirname, 'users.csv');
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/seniors';

function normalizeCellValue(value) {
  if (value === null || value === undefined) return '';
  return String(value).trim().replace(/\s+/g, ' ');
}

async function importUsers() {
  try {
    await mongoose.connect(MONGODB_URI, { family: 4 });
    console.log('Connected to MongoDB');

    // Read the Excel file
    const workbook = xlsx.readFile(EXCEL_FILE_PATH);
    const sheetName = workbook.SheetNames[0]; // Assuming first sheet
    const sheet = workbook.Sheets[sheetName];
    
    // Convert to JSON
    // Assuming the first row has headers: 'Name' and 'USN' (adjust if necessary)
    const data = xlsx.utils.sheet_to_json(sheet);
    
    let imported = 0;
    
    for (const row of data) {
      // Adjust the property names 'USN' and 'Name' based on your exact Excel column headers!
      const usn = normalizeCellValue(row['USN'] ?? row['usn']);
      const name = normalizeCellValue(row['Name'] ?? row['name']);

      if (!usn) {
        console.warn(`Skipping row due to missing USN:`, row);
        continue;
      }
      
      const otherDetails = { ...row };
      delete otherDetails['USN']; delete otherDetails['usn'];
      delete otherDetails['Name']; delete otherDetails['name'];

      const normalizedUsn = usn.toUpperCase();
      const existingUser = await User.findOne({ usn: normalizedUsn });
      if (!existingUser) {
        const user = new User({ 
          usn: normalizedUsn,
          name: name || '',
          otherDetails
        });
        await user.save();
        imported++;
      } else {
        // Optional: Update name and details if it exists already
        let updated = false;
        if (name && existingUser.name !== name) {
          existingUser.name = name;
          updated = true;
        }
        if (!existingUser.scanToken) {
          existingUser.scanToken = crypto.randomUUID();
          updated = true;
        }
        if (Object.keys(otherDetails).length > 0) {
          existingUser.otherDetails = { ...existingUser.otherDetails, ...otherDetails };
          updated = true;
        }
        if (updated) await existingUser.save();
      }
    }
    
    console.log(`Successfully imported ${imported} new users!`);
    
  } catch (error) {
    console.error('Error importing users:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

importUsers();
