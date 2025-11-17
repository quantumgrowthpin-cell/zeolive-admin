import axios from 'axios'

import { baseURL, key } from '@/util/config'

export const apiClient = (token, uid) => {
  return axios.create({
    baseURL: baseURL + 'api/admin',
    headers: {
      key: key,
      Authorization: `Bearer ${token}`,
      'x-auth-adm': uid
    },
    withCredentials: true
  })
}
