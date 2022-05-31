import { useState } from 'react';
import { GetStaticProps } from 'next';
import Prismic from '@prismicio/client';
import Head from 'next/head';
import { FaRegCalendarAlt, FaUserAlt } from 'react-icons/fa';
import Link from 'next/link';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { getPrismicClient } from '../services/prismic';

import commonStyles from '../styles/common.module.scss';
import styles from './home.module.scss';

interface Post {
  uid?: string;
  first_publication_date: string | null;
  data: {
    title: string;
    subtitle: string;
    author: string;
  };
}

interface PostPagination {
  next_page: string;
  results: Post[];
}

interface HomeProps {
  postsPagination: PostPagination;
}

export default function Home({ postsPagination }: HomeProps): JSX.Element {
  const postsFormated = postsPagination.results.map(post => {
    return {
      ...post,
      first_publication_date: format(
        new Date(post.first_publication_date),
        'dd MMM yyyy',
        {
          locale: ptBR,
        }
      ),
    };
  });

  const [posts, setPosts] = useState(postsFormated);
  const [nextPage, setNextPage] = useState(postsPagination.next_page);

  const handleNextPage = async (): Promise<void> => {
    const postsResults = await fetch(`${nextPage}`).then(response =>
      response.json()
    );
    setNextPage(postsResults.next_page);
    setPosts([
      ...posts,
      ...postsResults.results.map(post => {
        return {
          ...post,
          first_publication_date: format(
            new Date(post.first_publication_date),
            'dd MMM yyyy',
            {
              locale: ptBR,
            }
          ),
        };
      }),
    ]);
  };

  return (
    <>
      <Head>
        <title>Desafio | Charter III</title>
      </Head>
      <main className={commonStyles.contentContainer}>
        <ul>
          {posts.map(post => (
            <li key={post.uid}>
              <Link href={`/post/${post.uid}`}>
                <a>
                  <section className={commonStyles.postContainer}>
                    <h1>{post.data.title}</h1>
                    <p>{post.data.subtitle}</p>
                    <section>
                      <div>
                        <FaRegCalendarAlt />
                        <time>{post.first_publication_date}</time>
                      </div>

                      <div>
                        <FaUserAlt /> {post.data.author}
                      </div>
                    </section>
                  </section>
                </a>
              </Link>
            </li>
          ))}
        </ul>

        {nextPage && (
          <button
            className={styles.button}
            type="button"
            onClick={handleNextPage}
          >
            Carregar mais posts
          </button>
        )}
      </main>
    </>
  );
}

export const getStaticProps: GetStaticProps = async () => {
  const prismic = getPrismicClient();

  const postsResponse = await prismic.query(
    [Prismic.Predicates.at('document.type', 'post')],
    {
      pageSize: 1,
    }
  );

  const posts = postsResponse.results.map(post => {
    return {
      uid: post.uid,
      first_publication_date: post.first_publication_date,
      data: {
        title: post.data.title,
        subtitle: post.data.subtitle,
        author: post.data.author,
      },
    };
  });

  const postsPagination = {
    next_page: postsResponse.next_page,
    results: posts,
  };

  return {
    props: {
      postsPagination,
    },
    revalidate: 1800,
  };
};
