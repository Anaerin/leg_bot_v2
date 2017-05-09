# Code Map #

Okay, here's how this sucker's going to work.

## /lib ##

General utility functions and objects. For instance...

### log.js ###

Initializes and sets up logging using winston

### ~~oAuth.js~~ ###

~~Handles oAuth handshakes, for TMI login details and the like.~~ Maybe - currently handled by twitch.js

### Twitch.js ###

Handles communication with twitch. Has functions for each twitch API call, which return promises.

## /plugins ##

Plugins extend functionality. They can be enabled or disabled on a per-channel basis, they _may_ raise websockets events and API values, and can be configured via the web interface for the owner (and mods? - Can't get from the API, would have to log from chat, which has issues of its own) of a channel. Should be monolithic, one plugin per file, so **index.js** can load them all and they do their own setup with DB definitions and the like.

## /db ##

Holds basic database initializers. Stores channels, users, and settings. Also loads/initializes DB extensions from plugins... somehow. Using [sequelize](http://docs.sequelizejs.com/en/latest/), with their ES6 constructor syntax (which appears [not to be documented outside tickets](https://github.com/sequelize/sequelize/issues/6524), as it's not in the current stable release yet)

## /tmi ##

### Client.js ###

Opens a connection to Twitch Chat through [TMI.js](https://docs.tmijs.org/), maintains that connection, handles global events, creates/destroys channel objects and passes channel events through to them. Uses /lib/Twitch.js to get chat username and the like.

### Channel.js ###

Handles events for channels, uses settings to attach plugins.

## /web ##

The web interface.

### index.js ###

Provides top-level control.

### live.js ###

Shows currently live channels.

### login.js ###

Handles oAuth for Twitch, stores Twitch user ID in DB and in session, to keep user authorized for items that require it. Like...

## /web/admin ##
**REQUIRES oAUTH**

Allows user to control leg_bot in their channel, enabling and disabling plugins and configuring them as necessary.

## /web/public ##

Shows public pages from plugins, like statistics, quotes and the like. If user is logged in, allows them to make/change votes and the like, but login is not required to view.

## /web/code ##

Receives oAuth codes from twitch, and passes them off to /lib/Twitch.js, which should be waiting for them.

## /web/api ##

Various API endpoints for overlays and the like.

## /web/ws ##

Websockets endpoints. Hopefully working ones.