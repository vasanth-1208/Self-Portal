import { MongoClient } from "mongodb";

const required = (name) => {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
};

const members = [
  ["V BALAKUMAR", "TEAM LEADER", "9345662830", "DATA SCIENCE", "vbalakumar.cs24@bitsathy.ac.in", "7376241CS445", "V BALAKUMAR"],
  ["DHIVYA B", "VICE CAPTAIN", "8870211449", "FULL STACK & DEVOPS", "dhivyab.it24@bitsathy.ac.in", "7376242IT152", "DHIVYA B"],
  ["SHOBIKA P", "STRATEGIST", "9789293308", "FULL STACK & DEVOPS", "shobikap.cs24@bitsathy.ac.in", "7376241CS388", "SHOBIKA P"],
  ["VASANTHARAJ M", "TEAM MANAGER", "8838559660", "FULL STACK & DEVOPS", "vasantharajm.cs24@bitsathy.ac.in", "7376241CS453", "VASANTHARAJ M"],
  ["SURENDHAR R", "TEAM MEMBER - 1", "6379628050", "NON SPECIAL LAB", "surendharr.cs24@bitsathy.ac.in", "7376241CS419", "SURENDHAR R"],
  ["THAMARAIMANALAN R", "TEAM MEMBER - 2", "8220073173", "DATA SCIENCE", "thamaraimanalanr.cs24@bitsathy.ac.in", "7376241CS436", "THAMARAIMANALAN R"],
  ["ANISH D", "TEAM MEMBER - 3", "6379799381", "CLOUD & CYBER SECURITY", "anishd.cs24@bitsathy.ac.in", "7376241CS120", "ANISH D"],
  ["VIJAYPRAKASH A", "TEAM MEMBER - 4", "9342003277", "CLOUD & CYBER SECURITY", "vijayprakasha.cs24@bitsathy.ac.in", "7376241CS466", "VIJAYPRAKASH A"],
  ["DHARSHINI S R", "TEAM MEMBER - 5", "6369945128", "FULL STACK & DEVOPS", "dharshinisr.it24@bitsathy.ac.in", "7376242IT148", "DHARSHINI S R"],
  ["SELVASOBIKA M", "TEAM MEMBER - 6", "7639328940", "FULL STACK & DEVOPS", "selvasobikam.cs24@bitsathy.ac.in", "7376241CS376", "SELVASOBIKA M"],
  ["POOVARASAN K", "TEAM MEMBER - 8", "7010231794", "ARTFICIAL INTELLIGENCE", "poovarasank.cs25@bitsathy.ac.in", "7376251CS334", "POOVARASAN K"],
  ["AJAYKRISHNA P", "TEAM MEMBER - 9", "8075434297", "CLOUD & CYBER SECURITY", "ajaykrishnap.cs25@bitsathy.ac.in", "7376251CS109", "AJAYKRISHNA P"],
  ["DINESHKUMAR K", "TEAM MEMBER - 10", "9655135629", "MACHINE BUILDING (DRAI)", "dineshkumark.ad25@bitsathy.ac.in", "7376252AD162", "DINESHKUMAR K"],
  ["MAAJITH K", "TEAM MEMBER - 11", "9361281401", "FULL STACK & DEVOPS", "maajithk.cs25@bitsathy.ac.in", "7376251CS274", "MAAJITH K"],
  ["DULASIDASS V M", "TEAM MEMBER - 12", "8610761533", "FULL STACK & DEVOPS", "dulasidassvm.cs25@bitsathy.ac.in", "7376251CS173", "DULASIDASS V M"]
];

const client = new MongoClient(required("MONGODB_URI"));

const run = async () => {
  await client.connect();
  const db = client.db(process.env.MONGODB_DB_NAME || "a100005");
  const students = db.collection("students");

  for (const [name, position, phone, lab, email, rollNumber, sheetName] of members) {
    await students.updateOne(
      { email: email.toLowerCase() },
      {
        $set: {
          email: email.toLowerCase(),
          "values.Names": name,
          "values.Position": position,
          "values.Phone Number": phone,
          "values.Special Lab Name": lab,
          "values.Email": email.toLowerCase(),
          "values.Roll Number": rollNumber,
          "values.Google Sheet": sheetName
        },
        $setOnInsert: {
          targetSkills: [],
          "values.Reward Points": "0",
          "values.Activity Points": "0"
        }
      },
      { upsert: true }
    );
  }

  console.log(`Synced ${members.length} members.`);
};

run()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await client.close();
  });
