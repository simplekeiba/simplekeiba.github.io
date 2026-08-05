import satori from 'satori';
import { Resvg } from '@resvg/resvg-js';
import { fetchEpisodes } from '../../lib/podcast';
import fs from 'node:fs';

const zenKakuBuffer = fs.readFileSync('./public/fonts/ZenKakuGothicNew-Bold.ttf');
const notoSansBuffer = fs.readFileSync('./public/fonts/NotoSansJP-Regular.ttf');
const logoBuffer = fs.readFileSync('./public/assets/logo.jpg');
const logoBase64 = `data:image/jpeg;base64,${logoBuffer.toString('base64')}`;

export async function getStaticPaths() {
  const episodes = await fetchEpisodes();
  const paths = episodes.map(ep => ({
    params: { route: `${ep.slug}.png` },
    props: {
      title: ep.title,
      epNum: ep.episodeNumber,
    },
  }));
  
  // default
  paths.push({
    params: { route: 'default.png' },
    props: {
      title: 'シンプルKEIBA～難しくない競馬ラジオ～',
      epNum: null,
    },
  });

  return paths;
}

const hexToRgbStr = (hex: string): string => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? `rgb(${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)})` : 'rgb(255, 255, 255)';
};

const getWakuColor = (num: number | null): string => {
  if (!num) return '#FFFFFF';
  const waku = num % 8 === 0 ? 8 : num % 8;
  const hexColors = [
    '', '#FFFFFF', '#16161A', '#D6403A', '#2E5FBF',
    '#E8C33A', '#2E8B57', '#E8862E', '#F09BB0'
  ];
  return hexColors[waku];
};

export async function GET({ props }: any) {
  const { title, epNum } = props;
  const wakuColor = getWakuColor(epNum);
  
  const element = {
    type: 'div',
    props: {
      style: {
        display: 'flex',
        flexDirection: 'column',
        width: '1200px',
        height: '630px',
        backgroundColor: '#0B0B0D',
        padding: '60px 80px',
        borderLeft: `15px solid ${wakuColor}`,
        fontFamily: 'Zen Kaku Gothic New',
      },
      children: [
        {
          type: 'div',
          props: {
            style: {
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'center',
              marginBottom: '30px',
            },
            children: [
              {
                type: 'img',
                props: {
                  src: logoBase64,
                  width: 180,
                  height: 180,
                  style: { borderRadius: '12px' },
                },
              },
              {
                type: 'div',
                props: {
                  style: {
                    marginLeft: '40px',
                    fontSize: '64px',
                    color: '#D4AF37',
                    fontWeight: 'bold',
                  },
                  children: epNum ? `#${epNum}` : '番外編',
                },
              },
            ],
          },
        },
        {
          type: 'div',
          props: {
            style: {
              display: 'flex',
              flex: 1,
              flexDirection: 'column',
              justifyContent: 'center',
            },
            children: [
              {
                type: 'div',
                props: {
                  style: {
                    fontSize: '44px',
                    color: 'white',
                    width: '1020px', // 85% of 1200px
                    lineHeight: 1.5,
                    fontWeight: 'bold',
                    display: '-webkit-box',
                    overflow: 'hidden',
                  },
                  children: title.length > 66 ? title.slice(0, 66) + '…' : title,
                },
              }
            ],
          },
        },
        {
          type: 'div',
          props: {
            style: {
              display: 'flex',
              fontSize: '32px',
              color: '#888888',
              fontFamily: 'Noto Sans JP',
              marginTop: 'auto', // push to bottom
            },
            children: 'シンプルKEIBA - 難しくない競馬ラジオ -',
          },
        },
      ],
    },
  };

  const svg = await satori(element, {
    width: 1200,
    height: 630,
    fonts: [
      {
        name: 'Zen Kaku Gothic New',
        data: zenKakuBuffer,
        weight: 700,
        style: 'normal',
      },
      {
        name: 'Noto Sans JP',
        data: notoSansBuffer,
        weight: 400,
        style: 'normal',
      },
    ],
  });

  const resvg = new Resvg(svg, {
    fitTo: {
      mode: 'width',
      value: 1200,
    },
  });

  const pngData = resvg.render();
  const pngBuffer = pngData.asPng();

  return new Response(new Uint8Array(pngBuffer), {
    headers: {
      'Content-Type': 'image/png',
    },
  });
}
