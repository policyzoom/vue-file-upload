<template>
  <div style="width: 100%">
    <table>
        <tr>
            <th>Last Modified</th>
            <th>Size</th>
            <th>Key</th>
        </tr>
        <tr v-for="item in S3DATA_LIST" :key="item.Key">
          <td>{{item.LastModified}}</td>
          <td>{{item.Size}}</td>
          <td><a class="link" @click.prevent="loadDataFromS3(item)">{{item.keyText}}</a></td>
        </tr>
    </table>
    <!-- <div v-html="html">
    </div> -->
  </div>
</template>
<script>
import { bucket_url } from "../../s3_config.json";
import Vue from "vue";
import $ from "jquery";
export default {
  name: "browser",
  data() {
    return {
      S3B_SORT: "DEFAULT",
      EXCLUDE_FILE: [],
      S3B_ROOT_DIR: "",
      BUCKET_URL: bucket_url,
      S3BL_IGNORE_PATH: true,
      S3DATA_LIST: [],
      html: ""
    };
  },
  methods: {
    loadDataFromS3(item) {
      if (item.Type !== "file") {
        this.S3B_ROOT_DIR = item.Key;
        this.getS3Data();
      }
    },
    bytesToHumanReadable(sizeInBytes) {
      let i = -1;
      let units = [" kB", " MB", " GB"];
      do {
        sizeInBytes = sizeInBytes / 1024;
        i++;
      } while (sizeInBytes > 1024);
      return Math.max(sizeInBytes, 0.1).toFixed(1) + units[i];
    },
    sortFunction(a, b) {
      switch (this.S3B_SORT) {
        case "OLD2NEW":
          return a.LastModified > b.LastModified ? 1 : -1;
        case "NEW2OLD":
          return a.LastModified < b.LastModified ? 1 : -1;
        case "A2Z":
          return a.Key < b.Key ? 1 : -1;
        case "Z2A":
          return a.Key > b.Key ? 1 : -1;
        case "BIG2SMALL":
          return a.Size < b.Size ? 1 : -1;
        case "SMALL2BIG":
          return a.Size > b.Size ? 1 : -1;
      }
    },
    createS3QueryUrl(marker) {
      let s3_rest_url = this.BUCKET_URL;
      s3_rest_url += "?delimiter=/";

      //
      // Handling paths and prefixes:
      //
      // 1. S3BL_IGNORE_PATH = false
      // Uses the pathname
      // {bucket}/{path} => prefix = {path}
      //
      // 2. S3BL_IGNORE_PATH = true
      // Uses ?prefix={prefix}
      //
      // Why both? Because we want classic directory style listing in normal
      // buckets but also allow deploying to non-buckets
      //

      let rx = ".*[?&]prefix=" + this.S3B_ROOT_DIR + "([^&]+)(&.*)?$";
      let prefix = "";
      if (this.S3BL_IGNORE_PATH == false) {
        prefix = location.pathname.replace(/^\//, this.S3B_ROOT_DIR);
      }
      let match = location.search.match(rx);
      if (match) {
        prefix = this.S3B_ROOT_DIR + match[1];
      } else {
        if (this.S3BL_IGNORE_PATH) {
          prefix = this.S3B_ROOT_DIR;
        }
      }
      if (prefix) {
        // make sure we end in /
        prefix = prefix.replace(/\/$/, "") + "/";
        s3_rest_url += "&prefix=" + prefix;
      }
      if (marker) {
        s3_rest_url += "&marker=" + marker;
      }
      return s3_rest_url;
    },
    getInfoFromS3Data(xml) {
      const self = this;
      let prefix = $(xml.find("Prefix")[0]).text();
      let files = $.map(xml.find("Contents"), function(item) {
        item = $(item);
        // clang-format off
        return {
          Key: item.find("Key").text(),
          LastModified: item.find("LastModified").text(),
          Size: self.bytesToHumanReadable(item.find("Size").text()),
          Type: "file"
        };
        // clang-format on
      });
      if (prefix && files[0] && files[0].Key == prefix) {
        files.shift();
      }
      let directories = $.map(xml.find("CommonPrefixes"), function(item) {
        item = $(item);
        // clang-format off
        return {
          Key: item.find("Prefix").text(),
          LastModified: "",
          Size: "0",
          Type: "directory"
        };
        // clang-format on
      });
      let nextMarker = null;
      if ($(xml.find("IsTruncated")[0]).text() == "true") {
        nextMarker = $(xml.find("NextMarker")[0]).text();
      } else {
        nextMarker = null;
      }
      // clang-format off
      return {
        files: files,
        directories: directories,
        prefix: prefix,
        nextMarker: encodeURIComponent(nextMarker)
      };
      // clang-format on
    },
    prepareTable(info) {
      const self = this;
      var files = info.directories.concat(info.files),
        prefix = info.prefix;
      var cols = [45, 30, 15];
      var content = [];
      content.push(
        this.padRight("Last Modified", cols[1]) +
          "  " +
          this.padRight("Size", cols[2]) +
          "Key \n"
      );
      content.push(new Array(cols[0] + cols[1] + cols[2] + 4).join("-") + "\n");

      // add ../ at the start of the dir listing, unless we are already at root dir
      // if (prefix && prefix !== this.S3B_ROOT_DIR) {
      let count = (this.S3B_ROOT_DIR.match(/\//g) || []).length;
      if (count > 1) {
        var up = prefix
            .replace(/\/$/, "")
            .replace(/"/g, "&quot;")
            .split("/")
            .slice(0, -1)
            .concat("")
            .join("/"), // one directory up
          item = {
            Key: up,
            LastModified: "",
            Size: "",
            keyText: "../",
            href: this.S3BL_IGNORE_PATH ? "?prefix=" + up : "../"
          },
          row = this.renderRow(item, cols);
        content.push(row + "\n");
        this.S3DATA_LIST = [item, ...files];
      }
      $.each(files, function(idx, item) {
        // strip off the prefix
        item.keyText = item.Key.substring(prefix.length);
        if (item.Type === "directory") {
          if (self.S3BL_IGNORE_PATH) {
            item.href =
              location.protocol +
              "//" +
              location.hostname +
              location.pathname +
              "?prefix=" +
              self.encodePath(item.Key);
          } else {
            item.href = self.encodePath(item.keyText);
          }
        } else {
          item.href = self.BUCKET_URL + "/" + self.encodePath(item.Key);
        }
        var row = self.renderRow(item, cols);
        if (
          !self.EXCLUDE_FILE.some(function(exclude) {
            return self.testExcludeFilter(exclude, item.Key);
          })
        )
          content.push(row + "\n");
      });

      return content.join("");
    },
    encodePath(path) {
      return encodeURIComponent(path).replace(/%2F/g, "/");
    },
    renderRow(item, cols) {
      var row = "";
      row += this.padRight(item.LastModified, cols[1]) + "  ";
      row += this.padRight(item.Size, cols[2]);
      row += '<a href="' + item.href + '">' + item.keyText + "</a>";
      return row;
    },
    padRight(padString, length) {
      var str = padString.slice(0, length - 3);
      if (padString.length > str.length) {
        str += "...";
      }
      while (str.length < length) {
        str = str + " ";
      }
      return str;
    },
    getS3Data(marker, html) {
      const self = this;
      const s3_rest_url = this.createS3QueryUrl(marker);
      let axiosConfig = {
        headers: {
          "content-type": "text/plain"
        }
      };
      Vue.axios
        .get(s3_rest_url, axiosConfig)
        .then(res => {
          let info = this.getInfoFromS3Data($(res.data));
          if (self.S3B_SORT != "DEFAULT") {
            let sortedFiles = info.files;
            sortedFiles.sort(self.sortFunction);
            info.files = sortedFiles;
          }
          self.S3DATA_LIST = info.directories.concat(info.files);

          html =
            typeof html !== "undefined"
              ? html + this.prepareTable(info)
              : this.prepareTable(info);
          if (info.nextMarker != "null") {
            this.getS3Data(info.nextMarker, html);
          } else {
            // document.getElementById("listing").innerHTML =
            //   "<pre>" + html + "</pre>";
            this.html = "<pre>" + html + "</pre>";
          }
        })
        .catch(err => {
          console.log(err);
        });
    }
  },
  mounted() {
    let uri = window.location.search.substring(1); 
    let params = new URLSearchParams(uri);
    let form_id = params.get("id") === undefined ? '' : params.get("id");
    this.S3B_ROOT_DIR = form_id;
    this.getS3Data();
  }
};
</script>
<style lang="scss">
a.link {
  cursor: pointer;
  color: #007bff !important;
}
table {
  margin-top: 50px;
  width: 100%;
  tr {
    line-height: 28px;
    th {
      border-bottom: 1px dashed;
    }
  }
}
</style>
