const nodemailer = require('nodemailer');
const pug = require('pug');
const htmlToText = require('html-to-text');

module.exports = class Email {
    constructor(uzytkownik, url) {
        this.to = uzytkownik.email;
        this.imie = uzytkownik.name.split(' ')[0];
        this.url = url;
        this.from = `lutencjusz <${process.env.EMAIL_FROM}>`;
    }

    utworzTransport() {

        if (process.env.NODE_ENV.trim() === 'production') {
            console.log('wysłałem mejla na SendGrid...');
            return nodemailer.createTransport({
                service: 'SendGrid',
                auth: {
                    user: process.env.SENDGRID_USERNAME,
                    pass: process.env.SENDGRID_PASSWORD
                }
            })
        }

        console.log('wysłałem mejla na mailtrap ...');
        return nodemailer.createTransport({
            host: process.env.EMAIL_HOST,
            port: process.env.EMAIL_PORT,
            auth: {
                // type: 'default', // bez tego nie chce działać
                user: process.env.EMAIL_USERNAME,
                pass: process.env.EMAIL_PASSWORD
            }
        });
    }

    async wyslij(szablon, subject) {
        const html = pug.renderFile(`${__dirname}/../views/mejle/${szablon}.pug`, { // tworzy email html z szbalonu
            imie: this.imie,
            url: this.url,
            subject
        });

        const mailOpcje = {
            from: this.from,
            to: this.to,
            subject,
            html,
            text: htmlToText.fromString(html) // konweruje html na zwykły tekst
        };

        await this.utworzTransport().sendMail(mailOpcje);
    }

    async wyslijWitam() {
        await this.wyslij('witam', 'Witam w rodzinie wycieczkowiczów');
    }

    async wyslijResetHasla() {
        await this.wyslij('resetHasla', 'Reset hasła - możliwość tylko przez 5 min.');
    }
}

/*
// zastąpionne przez klasę email
const wyslijEmail = async opcje => { // wysyła za pomocą mailtrap

    // 1) Create a transporter
    /*
    // zastąpione przez utworzTransport
    const transporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST,
        port: process.env.EMAIL_PORT,
        auth: {
            type: 'default', // bez tego nie chce działać
            user: process.env.EMAIL_USERNAME,
            pass: process.env.EMAIL_PASSWORD
        }
    });
    */
// 2) Define the email opcje
/*
// zastąpione przez wyslij
const mailOpcje = {
    from: 'Jonas Schmedtmann <hello@jonas.io>',
    to: opcje.email,
    subject: opcje.subject,
    text: opcje.message
    // html:
};
*/

// 3) Actually send the email
/*
    await transporter.sendMail(mailOpcje);
};

module.exports = wyslijEmail;
*/