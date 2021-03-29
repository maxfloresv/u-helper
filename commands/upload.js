module.exports.run = async (bot, message, args) => {
    const { emojis } = require("../utils/emojis");
    const { join_phrase, 
            download_image, 
            check_attachments,
            match_link_attachment } = require("../utils/functions");
    const { MessageEmbed } = require("discord.js");

    const available_courses = ["MA1001", "MA1101", "FI1000"];
    const course_translation = {
        "MA1001": "Introducción al Cálculo",
        "MA1101": "Introducción al Álgebra",
        "FI1000": "Introducción a la Física Clásica"
    };
    const course_channel = {
        "MA1001": "823283829627420703",
        "MA1101": "823302702501986305",
        "FI1000": "823282568404664420"
    };
    
    let embed = new MessageEmbed()
        .setTitle(this.messages.choose_courses)
        .setDescription(this.messages.react_courses + "\n" + available_courses.map((val, index) => join_phrase((index + 1) + "\uFE0F\u20E3", val)).join("\n"))
        .setColor("BLUE")

    let msg_a = await message.channel.send(embed);
    for (let i = 0; i < available_courses.length; i++) {
        await msg_a.react((i + 1) + "\uFE0F\u20E3");
    }

    let filter = (reaction, user) => user.id == message.author.id && reaction.users.cache.has(bot.user.id);
    let r_collector_a = msg_a.createReactionCollector(filter, { max: 1 });

    r_collector_a.on("collect", async (reaction) => {
        await msg_a.delete();
        let number = reaction.emoji.name.codePointAt(0).toString(16)[1];
        let course = available_courses[number - 1];

        let main_channel = bot.channels.resolve(course_channel[course]);
        if (!main_channel)
            return message.channel.send(join_phrase(emojis["error"], this.messages.channel_not_exists));

        let msg_b = await message.channel.send(join_phrase(emojis["course"], 
            this.messages.course_chosen, course, "-", course_translation[course]) + ".\n" + this.messages.upload_prompt);

        let filter = (msg) => msg.author.id == message.author.id && check_attachments(msg);
        let m_collector_a = message.channel.createMessageCollector(filter, { max: 1 });

        m_collector_a.on("collect", async (msg) => {
            await msg_b.delete();
            let image_url = await download_image(String(match_link_attachment(msg.content)) || msg.attachments.first().url);
            let collection_size = await bot.get_coll_size({ course: course }, "exercises");
            let current_number = collection_size + 1;

            let exercises_msg = msg;
            let msg_c = await message.channel.send(join_phrase(emojis["tests"], this.messages.how_many));

            let filter = (msg) => msg.author.id == message.author.id && !isNaN(msg.content);
            let m_collector_b = message.channel.createMessageCollector(filter, { max: 1 });

            m_collector_b.on("collect", async (msg) => {
                await msg_c.delete();
                if (exercises_msg.deletable)
                    exercises_msg.delete();
                if (msg.deletable)
                    msg.delete();

                let embed = new MessageEmbed()
                    .setAuthor(join_phrase(course, "-", course_translation[course]))
                    .setTitle(join_phrase(this.messages.exercise_number, current_number) + ":")
                    .setDescription(join_phrase(emojis["course"], this.messages.credits, msg.content))
                    .setImage(image_url)
                    .setColor("BLUE");
    
                let msg_d = await main_channel.send(embed);
                let information = {
                    exercise_id: image_url.slice(-15, -4),
                    course: course,
                    message_id: msg_d.id,
                    number: current_number,
                    credits: Number(msg.content)
                };
                
                bot.create_data(information, "exercises").then(() => {
                    message.channel.send(join_phrase("✅", this.messages.success.replace("%channel%", main_channel.toString())));
                    bot.logs_channel.send(join_phrase(emojis["new_ex"], this.messages.new_exercise)
                        .replace("%channel%", main_channel.toString()));
                }).catch(() => 
                    message.channel.send(join_phrase(emojis["error"], this.messages.internal_error))
                );
            });
        });
    });
};

module.exports.help = {
    nombre: "upload",
    aliases: []
};

module.exports.messages = {
    choose_courses: "Elige un curso:",
    react_courses: "Reacciona a este mensaje con el emoji correspondiente.",
    course_chosen: "Has elegido el curso:",
    upload_prompt: "Sube el ejercicio propuesto en formato PNG, JPG o GIF.",
    exercise_number: "Propuesto n.°",
    channel_not_exists: "No existe un canal para ese curso. Contacta a un Administrador de comunidad para que solucione este error.",
    internal_error: "Ocurrió un error interno. Contacta a un Administrador de comunidad para que solucione este error.",
    success: "El ejercicio ha sido subido con éxito. Puedes revisarlo en el canal %channel%.",
    how_many: "¿Cuántos ejercicios se encuentran en la imagen que subiste?\n(Se toma como ejercicio un enunciado que derive a una o múltiples actividades)",
    credits: "Créditos:",
    new_exercise: "Un nuevo ejercicio ha sido propuesto en el canal %channel%."
};
