const { Types } = require("mongoose");
const { readdir } = require("fs").promises;
const db_files = await readdir(__dirname + "/../databases/models");
const available_models = db_files.map(elem => elem.slice(0, -3));

bot.create_data = async (data, db) => {
    if (!data || !db) return;
    if (!available_models.includes(db)) 
        return console.log("[-] (create_data) Se esperaba una colección existente.");

    const db_collection = require(`../databases/models/${db}`);
    let merged = Object.assign({ _id: Types.ObjectId() }, data);
    
    const new_data = new db_collection(merged);
    return new_data.save().catch(err => console.log(err));
};

bot.get_data = async ({ ...search }, db, inexistentSave = true) => {
    if (!search || !db) return;
    if (!available_models.includes(db)) 
        return console.log("[-] (get_data) Se esperaba una colección existente.");

    const db_collection = require(`../databases/models/${db}`);
    const data = await db_collection.findOne(search);

    if (!data && !inexistentSave) 
        await bot.create_data(search, db);

    return data || {};
};

bot.update_data = async ({ ...search }, { ...settings }, db) => {
    if (!search || !settings || !db) return;
    if (!available_models.includes(db)) 
        return console.log("[-] (update_data) Se esperaba una colección existente.");

    let data = await bot.get_data(search, db);
    if (typeof data !== "object") data = {};

    for (const key in settings) {
        if (data.hasOwnProperty(key)) {
            if (data[key] !== settings[key]) 
                data[key] = settings[key];
        }
    }
    return await data.updateOne(settings);
};
