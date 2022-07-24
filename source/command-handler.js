const weather = require('weather-js');

function splitArgs(input) {
	//Found on: https://stackoverflow.com/questions/2817646/javascript-split-string-on-space-or-on-quotes-to-array
	//The parenthesis in the regex creates a captured group within the quotes
    //Apparently this code doesn't actually work properly with escape sequences, because it's a fucking regex
    //so I'll eventually have to rewrite this bullshit myself.
	const regExp = /[^\s"]+|"([^"]*)"/gi;
	let finalArray = [];
	let match = null;

	do {
		//Each call to exec returns the next regex match as an array
		match = regExp.exec(input);
		if (match != null) {
			//Index 1 in the array is the captured group if it exists
			//Index 0 is the matched text, which we use if no captured group exists
			finalArray.push(match[1] ? match[1] : match[0]);
		}
	} while (match != null);

	return finalArray;
}

function handleCommand(content, userId, displayName, isPM) {
	//let userIsManager = isManager(userId);
	let args = splitArgs(content);

    let codeText = null;

    //Also capture codeText.
    if(content.includes('```')) {
        let codeTextStart = content.indexOf('```');
        let codeTextEnd = content.lastIndexOf('```');

        if(codeTextStart != codeTextEnd) {
            let wrappedCodeText = content.substring(codeTextStart, codeTextEnd);
            let wrappedCodeNewline = wrappedCodeText.indexOf('\n');

            if(wrappedCodeNewline != -1)
                codeText = wrappedCodeText.substring(wrappedCodeNewline + 1);
        }
    }

	//Remove the exclamation point from the first arg.
	let rawCommand = args[0].substring(1);
	let actualArgs = args.slice(1);

	//FIXME: Still need error handling/arg checking here.
	let commandHandlers = {
        weather: {
            execute() {
                let zipCode = actualArgs[0];

                if(zipCode == null)
                    return {message: 'Usage: `!weather [zipCode]`'}

                return new Promise((resolve, reject) => {
                    weather.find({search: zipCode, degreeType: 'F'}, (err, result) => {
                        let current = result[0].current;
                        let skyText = current.skytext;
                        let temperature = current.temperature;
                        let feelsLike = current.feelslike;
                        let humidity = current.humidity;
                        let windDisplay = current.winddisplay;
                        let imageUrl = current.imageUrl;

                        console.log({current});

                        let embed = {
                            fields: [
                                {
                                    name: 'Weather',
                                    value: skyText,
                                },
                                {
                                    name: 'Temperature',
                                    value: `${temperature} F (feels like ${feelsLike} F)`,
                                },
                                {
                                    name: 'Humidity',
                                    value: `${humidity}%`,
                                },
                                {
                                    name: 'Wind',
                                    value: windDisplay,
                                },
                            ]
                        };

                        if(imageUrl)
                            embed.thumbnail = {url: imageUrl};

                        resolve({embeds: [embed]});
                    });
                });
            }
        },
	}

	let commandHandler = commandHandlers[rawCommand];

	if(commandHandler == null)
        return null;

    if(commandHandler.managersOnly && !userIsManager)
        return {error: 'This command is for bot managers only.'};

    if(commandHandler.noPM && isPM)
        return {error: 'This command cannot be used in a PM.'};

    if(commandHandler.pmOnly && !isManager && !isPM)
        return {error: 'This command can only be used in a PM (spam prevention).'};

    try {
        return commandHandler.execute();
    } catch(commandError) {
        console.log({commandError});
        return {error: 'Handling this command resulted in an unexpected error.'};
    }
}

module.exports = {
    handleCommand,
}