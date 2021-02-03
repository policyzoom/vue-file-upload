import Vue from 'vue'
import config from './config'

export default {
  getSignedURL (file) {
    let uri = window.location.search.substring(1); 
    let params = new URLSearchParams(uri);
    console.log(params.get("id"));
    let form_id = params.get("id") === null ? '' : params.get("id");
    let endpoint = config.AWS_LAMBDA_GETSIGNEDURL_ENDPOINT

    const data = { 'filePath': file.name, 'contentType': file.type, 'formID': form_id };
    // const id_token = localStorage.getItem("id_token");
    let axiosConfig = {
      headers: {
        'content-type': 'multipart/form-data',
        // 'Authorization': `Bearer ${id_token}`
      }
    }
    return Vue.axios.post(endpoint, data, axiosConfig)
      .then((res) => {
        return Promise.resolve(res.data.url || '/')
      })
      .catch((err) => {
        console.log(err)
        return Promise.reject('/')
      })
  }
}
