# sensai-kata

This project offers an experimental client that serves as an interface between [KataGo](https://github.com/lightvector/KataGo) and [sensaigo.com](sensaigo.com).
In order to use the live-feedback features of sensaigo.com, you need to connect a KataGo instance to the server first.

**Warning**

The current code is in an early experimental state. Use at your own risk.

## Table of Contents

- [Installation](#installation)
- [Usage](#usage)
- [KataGo Configuration](#katago-configuration)
- [License](#license)

## Installation

To get started with SensaiGo, follow the instructions below to download and set it up.

### Prerequisites

- **Git**: You will need to install [Git](https://git-scm.com/downloads) to clone the repository.
- **Node.js**: Ensure you have Node.js installed on your machine. You can download it from [Node.js](https://nodejs.org/).

### Steps

1. **Clone the repository**:
    ```bash
    git clone https://github.com/n0tperfect/sensai-kata.git
    cd sensai-kata
    ```

2. **Install dependencies**:
    Run the following command to install the required packages:
    ```bash
    npm install
    ```

## Usage

Before using the client, you need to register a user at [sensaigo.com](sensaigo.com).

To run the program, use the following command:

```bash
# uses username specified in config.json
node kata_server.js

# override username
node kata_server.js -u username
```

This will start KataGo and a process that connects to [sensaigo.com](sensaigo.com) and registers this KataGo instance to your username.
The process will then listen to analyze requests coming from the server and communicate them to KataGo.

Only one of both players needs to have a KataGo instance connected for this to work.

Don't forget to stop the process (Ctrl+C on Windows) after you finish playing, or KataGo will keep running in the background and waste energy.

## KataGo Configuration

The repository includes a version of KataGo that I use on my machine and a more or less recent 18-block model file for KataGo.
This is the version that is used by default.

However, your machine might be very different and you might need to tweak the settings (e.g. number of visits) for a seamless experience.

KataGo uses the [analysis_example.cfg](katago/analysis_example.cfg) configuration file provided in the repository.

To adjust the settings to make them perfect for your machine, please consult the [KataGo documentation](katago/README.txt).

**Quick tip**

If there is too much delay between moves and feedback, reduce **maxVisits** value (default=1000) in the config file.

It is also possible to use your own KataGo that is already configured on your machine.
In this case you'll have to adjust the command to run the program in [kata_server.js](kata_server.js#L71).

## License

This project is licensed under the Apache License 2.0. 
You may use, distribute, and modify this code under the terms of the Apache License 2.0.

You can find the full license text in the [LICENSE](LICENSE) file included in this repository, or at the following link:

[Apache License 2.0](https://www.apache.org/licenses/LICENSE-2.0)

### Key Points:
- **Permissive License**: Allows for commercial and private use, modification, and distribution.
- **Attribution**: Requires that you include the original copyright notice and the license text in any distribution of your code.
- **Patent Protection**: Grants users explicit rights to use any patents related to this software.

For further details, please refer to the full license text.
