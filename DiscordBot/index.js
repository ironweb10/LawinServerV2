const { Client, Intents, MessageEmbed } = require("discord.js");

const fs = require("fs");

const axios = require("axios");

const client = new Client({ intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES, Intents.FLAGS.GUILD_PRESENCES] }); // Añadido GUILD_PRESENCES

const config = JSON.parse(fs.readFileSync("./Config/config.json").toString());

const log = require("../structs/log.js");

log.bot("loading")

// Load status message ID

let statusMessageConfig;

try {

    statusMessageConfig = JSON.parse(fs.readFileSync("./Config/statusMessage.json").toString());

} catch (error) {

    statusMessageConfig = { message_id: "1244280797041524741" };

}



client.once("ready", async () => {

    log.bot("Bot is up and running!");



    // Set a custom status for the bot

    client.user.setPresence({

        activities: [{ name: 'By iron web10, mtbr_29 and harharidkkk', type: 'PLAYING' }], // Type can be PLAYING, STREAMING, LISTENING, WATCHING

        status: 'online' // Can be 'online', 'idle', 'dnd', or 'invisible'

    });



    let commands = client.application.commands;



    fs.readdirSync("./DiscordBot/commands").forEach(fileName => {

        const command = require(`./commands/${fileName}`);

        commands.create(command.commandInfo);

    });



    // Call the function to send or edit the static message

    await sendStaticMessage();

    setInterval(sendStaticMessage, 60000);

});



let staticMessage = null;



const sendStaticMessage = async () => {

    try {

        const channel = await client.channels.fetch(config.discord.status_channel_id); // Corrected to status_channel_id

        const playersOnline = global.Clients ? global.Clients.length : 0; 

        

        const embed = new MessageEmbed()

            .setTitle('Pulsar 9000 Project Status')

            .setDescription("Current Players")

            .setColor('#ffffff')

            .addFields([

                {

                    name: "Players Online",

                    value: `Players: ${playersOnline}`,

                    inline: true

                },

                {

                    name: 'Backend Status',

                    value: "🟢",

                    inline: false

                },

                {

                    name: 'Matchmaking Status',

                    value: "🟡",

                    inline: false

                },

            ])

            .setFooter({

                text: "Pulsar 9000 Project",

                iconURL: "https://cdn.discordapp.com/avatars/1142920642111488163/7c738c7fd9bdcbae8a20fc6055f3f565.webp",

            })

            .setTimestamp();



        if (statusMessageConfig.message_id) {

            try {

                staticMessage = await channel.messages.fetch(statusMessageConfig.message_id);

                await staticMessage.edit({ embeds: [embed] });

            } catch (error) {

                // If the message no longer exists, send a new one

                staticMessage = await channel.send({ embeds: [embed] });

                statusMessageConfig.message_id = staticMessage.id;

                fs.writeFileSync("./Config/statusMessage.json", JSON.stringify(statusMessageConfig));

            }

        } else {

            // If no message ID, send a new one

            staticMessage = await channel.send({ embeds: [embed] });

            statusMessageConfig.message_id = staticMessage.id;

            fs.writeFileSync("./Config/statusMessage.json", JSON.stringify(statusMessageConfig));

        }

    } catch (error) {

        logErrorToWebhook(error);

    }

};



const logErrorToWebhook = async (error) => {

    try {

        await axios.post(config.webhook_url, {

            content: `An error occurred: ${error.message}`

        });

    } catch (webhookError) {

        console.error("Failed to send error to webhook:", webhookError);

    }

};



client.on("interactionCreate", async interaction => {

    if (!interaction.isCommand()) return;



    if (fs.existsSync(`./DiscordBot/commands/${interaction.commandName}.js`)) {

        try {

            const command = require(`./commands/${interaction.commandName}.js`);

            await command.execute(interaction);

        } catch (error) {

            logErrorToWebhook(error);

        }

    }

});



client.on("presenceUpdate", async (oldPresence, newPresence) => {

    const member = newPresence.member;

    const targetRoleId = "1244246035706941500"; // ID del rol específico



    if (!member.guild.roles.cache.has(targetRoleId)) {

        log.bot("Target role not found");

        return;

    }



    if (newPresence.activities.some(activity => activity.state === "dsc.gg/pulsarfn")) {

        if (!member.roles.cache.has(targetRoleId)) {

            await member.roles.add(targetRoleId);

            log.bot(`Added role to ${member.user.tag}`);

        }

    } else {

        if (oldPresence && oldPresence.activities.some(activity => activity.state === "dsc.gg/pulsarfn")) {

            await member.roles.remove(targetRoleId);

            log.bot(`Removed role from ${member.user.tag}`);

        }

    }

});



client.on("error", logErrorToWebhook);



client.login(process.env.token);

