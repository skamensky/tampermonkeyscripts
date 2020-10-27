import os

links = "\n* " + "\n* ".join([f"{f}: https://raw.githubusercontent.com/skamensky/tampermonkeyscripts/master/src/{f}" for f in os.listdir('src')])

readme = f'''
These are [Tamper Monkey](https://chrome.google.com/webstore/detail/tampermonkey/dhdgffkkebhmkfjojejmpbldmpobfkfo?hl=en) scripts
To install one of these, go to the Tamper Monkey dashboard -> Utilities, paste one of the links below into "Install From URL", press install, and press install again. You're done.

Links:
{links}



Check [here](https://www.tampermonkey.net/index.php?version=4.10&ext=dhdg&updated=true#script_update) for how to set the scripts up for auto updates.
'''
open('README.md','w+').write(readme)
