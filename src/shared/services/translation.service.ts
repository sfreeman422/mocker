import Axios, { AxiosResponse } from 'axios';

export class TranslationService {
  public translate(text: string): Promise<string> {
    const lang = this.getRandomLanguage();
    return Axios.post(
      `https://translation.googleapis.com/language/translate/v2?key=${process.env.GOOGLE_TRANSLATE_API_KEY}`,
      {
        q: text,
        source: 'en',
        target: lang,
        format: 'text',
      },
    ).then((res: AxiosResponse) => {
      console.log(text);
      console.log('translating from en to ', lang);
      console.log(res?.data?.data?.translations?.[0].translatedText);
      return res?.data?.data?.translations?.[0].translatedText;
    });
  }

  private getRandomLanguage(): string {
    const roll = Math.random();
    if (roll >= 0.25) {
      return 'es';
    }
    return 'de';
  }
}
