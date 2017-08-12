# leg_bot v2

A newer, faster, better, more extensible version of leg_bot. Re-written from the ground up with ES6 (as much as I can, and as much as node.js supports).

## So what does it do?

Right now? Spits out a URL for a token, that will allow it to connect to TMI (Which it will do, and join it's own channel). It has a reasonable DB API (db/index.js - Tables are defined in files using a common format, then dynamically loaded at runtime). There's kind of a Plugin API, using a standard class to inherit from, including DB definitions (in the same style as the DB API above), and the channel (and client) objects passed in at creation will fire events for messages and commands sent in. It also has the beginning of a web interface that will allow you to log in using your Twitch credentials and fetch information about you as a user, and the channel you have. In theory, the web interface should also show which channels are currently live (like http://ghostoflegbot.website/live does), and allow you to customize what the bot does in your channel, including enabling plugins and customizing them if appropriate. The "Follow" option should also allow you to choose wether the bot is following you (so you appear on the /live page and to the !live command), but at the moment none of that is hooked up.

## What's the plan?

Well, I've got a kind of [roadmap](CodeMap.md) that I'm working with. Of course, it can all change at a moment's notice, but that's what I've got so far. It's a little out of date, however.

## What can I do?

Ideas, Pull Requests, all that kind of thing would be awesome. Support and interaction would be great. Donations would be nice too, both for this and the running of ghost_of_leg_bot. No pressure.