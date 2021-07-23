import Axios, { AxiosResponse } from 'axios';

export class TranslationService {
  public translate(text: string, lang: string): Promise<string> {
    return Axios.post(
      `https://translation.googleapis.com/language/translate/v2?key=${process.env.GOOGLE_TRANSLATE_API_KEY}`,
      {
        q: text,
        source: 'en',
        target: lang,
        format: 'text',
      },
    ).then((res: AxiosResponse) => {
      console.log(res?.data?.data?.translations?.[0].translatedText);
      return res?.data?.data?.translations?.[0].translatedText;
    });
  }

  getRandomLanguage(): string {
    const roll = Math.random();
    if (roll >= 0.25) {
      return 'es';
    }
    return 'de';
  }
}
